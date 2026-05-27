import { politicians } from "@/lib/data";
import { PoliticianScoreContext } from "@/lib/trade-significance";
import { EdgeTier } from "@/lib/repeatable-edge";
import { Party, UnifiedCongressTrade } from "@/types";

export interface PoliticianMetadata {
  id: string;
  name: string;
  party: Party;
  chamber: UnifiedCongressTrade["chamber"];
  state: string;
  committee?: string;
  returnVsSpy: number;
}

const mockIndex = new Map<string, PoliticianMetadata>(
  politicians.map((politician) => [
    politician.id,
    {
      id: politician.id,
      name: politician.name,
      party: politician.party,
      chamber: politician.chamber,
      state: politician.state,
      committee: politician.committee,
      returnVsSpy: politician.returnVsSpy,
    },
  ])
);

export function getPoliticianMetadata(
  politicianId: string
): PoliticianMetadata | undefined {
  return mockIndex.get(politicianId);
}

export function buildPoliticianMetadataIndex(
  trades: UnifiedCongressTrade[],
  leaderboardReturns?: Array<{
    id: string;
    returnVsSpy: number;
    edgeScore?: number;
    edgeTier?: EdgeTier;
    edgeWinRate?: number;
    edgeLabel?: string;
    edgeActionHint?: string;
  }>
): Map<string, PoliticianScoreContext & { name?: string; state?: string }> {
  const index = new Map<
    string,
    PoliticianScoreContext & { name?: string; state?: string }
  >();

  for (const politician of politicians) {
    index.set(politician.id, {
      returnVsSpy: politician.returnVsSpy,
      committee: politician.committee,
      name: politician.name,
      state: politician.state,
    });
  }

  for (const entry of leaderboardReturns ?? []) {
    const existing = index.get(entry.id);
    index.set(entry.id, {
      ...existing,
      returnVsSpy: entry.returnVsSpy,
      edgeScore: entry.edgeScore,
      edgeTier: entry.edgeTier,
      edgeWinRate: entry.edgeWinRate,
      edgeLabel: entry.edgeLabel,
      edgeActionHint: entry.edgeActionHint,
    });
  }

  for (const trade of trades) {
    if (index.has(trade.politicianId)) continue;

    index.set(trade.politicianId, {
      returnVsSpy: undefined,
      committee: undefined,
      name: trade.politicianName,
    });
  }

  return index;
}

export function enrichTradeWithMetadata(
  trade: UnifiedCongressTrade
): UnifiedCongressTrade {
  const meta = mockIndex.get(trade.politicianId);
  if (!meta) return trade;

  return {
    ...trade,
    party: meta.party,
    chamber: meta.chamber,
    politicianName: meta.name,
    sector: trade.sector || meta.committee ? trade.sector : trade.sector,
  };
}
