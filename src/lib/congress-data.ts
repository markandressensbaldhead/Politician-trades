import { LeaderboardEntry, Party, SearchPoliticianEntry, Chamber } from "@/types";
import { politicians } from "@/lib/data";
import { getPoliticianMetadata } from "@/lib/politician-metadata";
import { computeRepeatableEdge } from "@/lib/repeatable-edge";
import { getTrumpSearchEntry } from "@/lib/trump-data";
import {
  averageExcessReturn,
  isWithinLast90Days,
} from "@/lib/quiver-mappers";
import {
  loadUnifiedTrades,
  toLegacyRecentTrade,
  TradeDataSource,
} from "@/lib/unified-trades";
import { UnifiedCongressTrade } from "@/types";

export interface RecentCongressTrade {
  id: string;
  ticker: string;
  company: string;
  type: "Purchase" | "Sale";
  amount: string;
  date: string;
  filingDate: string | null;
  disclosureLagDays: number | null;
  sector: string;
  politicianId: string;
  politicianName: string;
  party: string;
  chamber: string;
  excessReturn: number | null;
}

function groupUnifiedByPolitician(trades: UnifiedCongressTrade[]) {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      party: Party;
      chamber: Chamber;
      allTrades: UnifiedCongressTrade[];
      recentTrades: UnifiedCongressTrade[];
    }
  >();

  for (const trade of trades) {
    const existing = grouped.get(trade.politicianId);

    if (existing) {
      existing.allTrades.push(trade);
      if (isWithinLast90Days(trade.tradeDate)) {
        existing.recentTrades.push(trade);
      }
      continue;
    }

    grouped.set(trade.politicianId, {
      id: trade.politicianId,
      name: trade.politicianName,
      party: trade.party,
      chamber: trade.chamber,
      allTrades: [trade],
      recentTrades: isWithinLast90Days(trade.tradeDate) ? [trade] : [],
    });
  }

  return grouped;
}

export function buildLeaderboardFromUnified(
  trades: UnifiedCongressTrade[]
): LeaderboardEntry[] {
  const grouped = groupUnifiedByPolitician(trades);

  return Array.from(grouped.values())
    .map((group) => {
      const excessReturns = group.recentTrades
        .map((trade) => trade.excessReturn ?? 0)
        .filter((value) => Number.isFinite(value));

      const edge = computeRepeatableEdge(group.allTrades);
      const meta = getPoliticianMetadata(group.id);

      return {
        id: group.id,
        name: group.name,
        party: group.party,
        chamber: group.chamber,
        state: meta?.state ?? "",
        district: politicians.find((p) => p.id === group.id)?.district,
        tradesLast90Days: group.recentTrades.length,
        totalTrades: group.allTrades.length,
        returnVsSpy: averageExcessReturn(excessReturns),
        edgeScore: edge.edgeScore,
        edgeTier: edge.edgeTier,
        edgeWinRate: edge.winRate,
        edgeLabel: edge.edgeLabel,
        edgeActionHint: edge.actionHint,
      };
    })
    .sort((a, b) => {
      if (b.edgeScore !== a.edgeScore) {
        return (b.edgeScore ?? 0) - (a.edgeScore ?? 0);
      }

      if (b.returnVsSpy !== a.returnVsSpy) {
        return b.returnVsSpy - a.returnVsSpy;
      }

      return b.tradesLast90Days - a.tradesLast90Days;
    });
}

export function buildSearchIndexFromUnified(
  trades: UnifiedCongressTrade[]
): SearchPoliticianEntry[] {
  const grouped = groupUnifiedByPolitician(trades);

  return Array.from(grouped.values())
    .map((group) => {
      const excessReturns = group.recentTrades
        .map((trade) => trade.excessReturn ?? 0)
        .filter((value) => Number.isFinite(value));

      const topTickers = [
        ...new Set(group.recentTrades.map((trade) => trade.ticker)),
      ].slice(0, 3);

      return {
        id: group.id,
        name: group.name,
        party: group.party,
        chamber: group.chamber,
        state: "",
        committee:
          topTickers.length > 0
            ? `Recent: ${topTickers.join(", ")}`
            : undefined,
        tradesLast90Days: group.recentTrades.length,
        totalTrades: group.allTrades.length,
        returnVsSpy: averageExcessReturn(excessReturns),
        source: "live" as const,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildSearchIndexFromMock(): SearchPoliticianEntry[] {
  return politicians.map((politician) => ({
    id: politician.id,
    name: politician.name,
    party: politician.party,
    chamber: politician.chamber,
    state: politician.state,
    district: politician.district,
    committee: politician.committee,
    tradesLast90Days: politician.tradesLast90Days,
    totalTrades: politician.totalTrades,
    returnVsSpy: politician.returnVsSpy,
    ytdReturn: politician.ytdReturn,
    portfolioValue: politician.portfolioValue,
    source: "mock" as const,
  }));
}

function mapSource(source: TradeDataSource): "live" | "mock" {
  return source === "mock" ? "mock" : "live";
}

export async function getLeaderboardData(): Promise<{
  entries: LeaderboardEntry[];
  source: "live" | "mock";
}> {
  const { trades, source } = await loadUnifiedTrades();

  return {
    entries: buildLeaderboardFromUnified(trades),
    source: mapSource(source),
  };
}

export async function getSearchIndex(): Promise<{
  politicians: SearchPoliticianEntry[];
  source: "live" | "mock";
}> {
  const { trades, source } = await loadUnifiedTrades();

  if (source === "mock") {
    return {
      politicians: [await getTrumpSearchEntry(), ...buildSearchIndexFromMock()],
      source: "mock",
    };
  }

  return {
    politicians: [
      await getTrumpSearchEntry(),
      ...buildSearchIndexFromUnified(trades),
    ],
    source: mapSource(source),
  };
}

export async function getRecentTrades(limit = 100): Promise<{
  trades: RecentCongressTrade[];
  source: "live" | "mock";
}> {
  const { trades, source } = await loadUnifiedTrades();

  const sorted = [...trades].sort(
    (a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
  );

  return {
    trades: sorted.slice(0, limit).map(toLegacyRecentTrade),
    source: mapSource(source),
  };
}

export async function getAllTrades(): Promise<{
  trades: UnifiedCongressTrade[];
  source: TradeDataSource;
}> {
  return loadUnifiedTrades();
}

export function filterLeaderboardByChamber(
  entries: LeaderboardEntry[],
  filter: "all" | "senate" | "house"
): LeaderboardEntry[] {
  if (filter === "all") {
    return entries;
  }

  const chamber = filter === "senate" ? "Senate" : "House";
  return entries.filter((entry) => entry.chamber === chamber);
}

// Legacy export for sync paths still using Quiver directly
export { loadUnifiedTrades as loadCongressTrades };
