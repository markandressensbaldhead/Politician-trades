import { LeaderboardEntry } from "@/types";
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
  QuiverCongressTrade,
} from "@/lib/quiverquant";

export function buildLeaderboardFromTrades(
  trades: QuiverCongressTrade[]
): LeaderboardEntry[] {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      party: ReturnType<typeof mapParty>;
      chamber: ReturnType<typeof mapChamber>;
      trades: QuiverCongressTrade[];
    }
  >();

  for (const trade of trades) {
    if (!isWithinLast90Days(trade.TransactionDate)) {
      continue;
    }

    const id = trade.BioGuideID || slugify(trade.Representative);
    const existing = grouped.get(id);

    if (existing) {
      existing.trades.push(trade);
    } else {
      grouped.set(id, {
        id,
        name: trade.Representative,
        party: mapParty(trade.Party),
        chamber: mapChamber(trade.House),
        trades: [trade],
      });
    }
  }

  const entries: LeaderboardEntry[] = [];

  for (const group of grouped.values()) {
    const excessReturns = group.trades
      .map((trade) => trade.ExcessReturn ?? 0)
      .filter((value) => Number.isFinite(value));

    entries.push({
      id: group.id,
      name: group.name,
      party: group.party,
      chamber: group.chamber,
      state: "",
      tradesLast90Days: group.trades.length,
      returnVsSpy: averageExcessReturn(excessReturns),
    });
  }

  return entries.sort((a, b) => b.returnVsSpy - a.returnVsSpy);
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
      returnVsSpy: politician.returnVsSpy,
    }))
    .sort((a, b) => b.returnVsSpy - a.returnVsSpy);
}

export async function getLeaderboardData(): Promise<{
  entries: LeaderboardEntry[];
  source: "live" | "mock";
}> {
  const apiKey = process.env.QUIVERQUANT_API_KEY;

  if (apiKey) {
    try {
      const trades = await fetchCongressTrades(apiKey);
      const entries = buildLeaderboardFromTrades(trades);

      if (entries.length > 0) {
        return { entries, source: "live" };
      }
    } catch {
      // Fall through to mock data when the API is unavailable.
    }
  }

  return { entries: buildLeaderboardFromMock(), source: "mock" };
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
