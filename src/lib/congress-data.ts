import { LeaderboardEntry, Party, SearchPoliticianEntry } from "@/types";
import { getTrumpSearchEntry } from "@/lib/trump-data";
import { politicians } from "@/lib/data";
import {
  averageExcessReturn,
  isWithinLast90Days,
  mapChamber,
  mapParty,
  slugify,
} from "@/lib/quiver-mappers";
import {
  fetchCongressTrades,
  normalizeTradeType,
  QuiverCongressTrade,
} from "@/lib/quiverquant";

export interface RecentCongressTrade {
  id: string;
  ticker: string;
  company: string;
  type: "Purchase" | "Sale";
  amount: string;
  date: string;
  sector: string;
  politicianId: string;
  politicianName: string;
  party: string;
}

export async function loadCongressTrades(): Promise<{
  trades: QuiverCongressTrade[];
  source: "live" | "mock";
}> {
  const apiKey = process.env.QUIVERQUANT_API_KEY;

  if (!apiKey) {
    return { trades: [], source: "mock" };
  }

  try {
    const trades = await fetchCongressTrades(apiKey);

    if (trades.length > 0) {
      return { trades, source: "live" };
    }
  } catch (error) {
    console.error(
      "QuiverQuant fetch failed:",
      error instanceof Error ? error.message : error
    );
  }

  return { trades: [], source: "mock" };
}

function groupTradesByPolitician(trades: QuiverCongressTrade[]) {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      party: Party;
      chamber: ReturnType<typeof mapChamber>;
      allTrades: QuiverCongressTrade[];
      recentTrades: QuiverCongressTrade[];
    }
  >();

  for (const trade of trades) {
    const id = trade.BioGuideID || slugify(trade.Representative);
    const existing = grouped.get(id);

    if (existing) {
      existing.allTrades.push(trade);
      if (isWithinLast90Days(trade.TransactionDate)) {
        existing.recentTrades.push(trade);
      }
      continue;
    }

    grouped.set(id, {
      id,
      name: trade.Representative,
      party: mapParty(trade.Party),
      chamber: mapChamber(trade.House),
      allTrades: [trade],
      recentTrades: isWithinLast90Days(trade.TransactionDate) ? [trade] : [],
    });
  }

  return grouped;
}

export function buildLeaderboardFromTrades(
  trades: QuiverCongressTrade[]
): LeaderboardEntry[] {
  const grouped = groupTradesByPolitician(trades);

  const entries: LeaderboardEntry[] = Array.from(grouped, ([, group]) => {
    const excessReturns = group.recentTrades
      .map((trade) => trade.ExcessReturn ?? 0)
      .filter((value) => Number.isFinite(value));

    return {
      id: group.id,
      name: group.name,
      party: group.party,
      chamber: group.chamber,
      state: "",
      tradesLast90Days: group.recentTrades.length,
      totalTrades: group.allTrades.length,
      returnVsSpy: averageExcessReturn(excessReturns),
    };
  });

  return entries.sort((a, b) => {
    if (b.returnVsSpy !== a.returnVsSpy) {
      return b.returnVsSpy - a.returnVsSpy;
    }

    return b.tradesLast90Days - a.tradesLast90Days;
  });
}

export function buildLeaderboardFromMock(): LeaderboardEntry[] {
  return politicians
    .map((politician) => ({
      id: politician.id,
      name: politician.name,
      party: politician.party,
      chamber: politician.chamber,
      state: politician.state,
      district: politician.district,
      tradesLast90Days: politician.tradesLast90Days,
      totalTrades: politician.totalTrades,
      returnVsSpy: politician.returnVsSpy,
    }))
    .sort((a, b) => b.returnVsSpy - a.returnVsSpy);
}

export function buildSearchIndexFromTrades(
  trades: QuiverCongressTrade[]
): SearchPoliticianEntry[] {
  const grouped = groupTradesByPolitician(trades);

  return Array.from(grouped, ([, group]) => {
    const excessReturns = group.recentTrades
      .map((trade) => trade.ExcessReturn ?? 0)
      .filter((value) => Number.isFinite(value));

    return {
      id: group.id,
      name: group.name,
      party: group.party,
      chamber: group.chamber,
      state: "",
      tradesLast90Days: group.recentTrades.length,
      totalTrades: group.allTrades.length,
      returnVsSpy: averageExcessReturn(excessReturns),
      source: "live" as const,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildSearchIndexFromMock(): SearchPoliticianEntry[] {
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

export function buildRecentTradesFromQuiver(
  trades: QuiverCongressTrade[],
  limit = 20
): RecentCongressTrade[] {
  return [...trades]
    .sort(
      (a, b) =>
        new Date(b.TransactionDate).getTime() -
        new Date(a.TransactionDate).getTime()
    )
    .slice(0, limit)
    .map((trade, index) => {
      const tradeType = normalizeTradeType(trade.Transaction);

      return {
        id: `${trade.BioGuideID || slugify(trade.Representative)}-${trade.TransactionDate}-${trade.Ticker}-${index}`,
        ticker: trade.Ticker,
        company: trade.Description?.trim() || trade.Ticker,
        type: tradeType === "buy" ? "Purchase" : "Sale",
        amount: trade.Range,
        date: trade.TransactionDate,
        sector: trade.TickerType ?? "",
        politicianId: trade.BioGuideID || slugify(trade.Representative),
        politicianName: trade.Representative,
        party: mapParty(trade.Party),
      };
    });
}

export function buildRecentTradesFromMock(limit = 20): RecentCongressTrade[] {
  const rows: RecentCongressTrade[] = [];

  for (const politician of politicians) {
    for (const trade of politician.trades) {
      rows.push({
        id: `${politician.id}-${trade.id}`,
        ticker: trade.ticker,
        company: trade.company,
        type: trade.type,
        amount: trade.amount,
        date: trade.date,
        sector: trade.sector,
        politicianId: politician.id,
        politicianName: politician.name,
        party: politician.party,
      });
    }
  }

  return rows
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, limit);
}

export async function getLeaderboardData(): Promise<{
  entries: LeaderboardEntry[];
  source: "live" | "mock";
}> {
  const { trades, source } = await loadCongressTrades();

  if (source === "live") {
    return { entries: buildLeaderboardFromTrades(trades), source: "live" };
  }

  return { entries: buildLeaderboardFromMock(), source: "mock" };
}

export async function getSearchIndex(): Promise<{
  politicians: SearchPoliticianEntry[];
  source: "live" | "mock";
}> {
  const { trades, source } = await loadCongressTrades();

  if (source === "live") {
    return {
      politicians: [getTrumpSearchEntry(), ...buildSearchIndexFromTrades(trades)],
      source: "live",
    };
  }

  return {
    politicians: [getTrumpSearchEntry(), ...buildSearchIndexFromMock()],
    source: "mock",
  };
}

export async function getRecentTrades(limit = 20): Promise<{
  trades: RecentCongressTrade[];
  source: "live" | "mock";
}> {
  const { trades, source } = await loadCongressTrades();

  if (source === "live") {
    return {
      trades: buildRecentTradesFromQuiver(trades, limit),
      source: "live",
    };
  }

  return {
    trades: buildRecentTradesFromMock(limit),
    source: "mock",
  };
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
