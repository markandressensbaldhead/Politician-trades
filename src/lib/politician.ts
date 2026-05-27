import { Politician, PoliticianProfileData, ProfileTrade, UnifiedCongressTrade } from "@/types";
import { getPoliticianById, politicians } from "@/lib/data";
import {
  isTrumpProfileId,
  TRUMP_PROFILE_ID,
  getTrumpProfile,
} from "@/lib/trump-data";
import { getMockTradeEnrichment } from "@/lib/mock-enrichment";
import { getPoliticianMetadata } from "@/lib/politician-metadata";
import { enrichProfileWithLockedSecData } from "@/lib/supabase/sec-filings";
import {
  averageExcessReturn,
  computeWinRate,
  isWithinLast90Days,
  slugify,
} from "@/lib/quiver-mappers";
import { loadUnifiedTrades, TradeDataSource } from "@/lib/unified-trades";
import { fetchLiveCongressTrades } from "@/lib/congress-trade-source";
import { getPreferredCongressProvider } from "@/lib/congress-trade-source";

function unifiedToProfileTrade(trade: UnifiedCongressTrade): ProfileTrade {
  return {
    id: trade.id,
    ticker: trade.ticker,
    company: trade.company,
    type: trade.type,
    amount: trade.amount,
    tradeDate: trade.tradeDate,
    filingDate: trade.filingDate ?? trade.tradeDate,
    excessReturn: trade.excessReturn ?? undefined,
    priceChange: trade.priceChange,
    spyChange: trade.spyChange,
    sector: trade.sector,
  };
}

function buildProfileFromMock(politician: Politician): PoliticianProfileData {
  return {
    id: politician.id,
    name: politician.name,
    party: politician.party,
    chamber: politician.chamber,
    state: politician.state,
    district: politician.district,
    committee: politician.committee,
    source: "mock",
    tradesLast90Days: politician.tradesLast90Days,
    totalTrades: politician.totalTrades,
    returnVsSpy: politician.returnVsSpy,
    winRate: politician.winRate,
    portfolioValue: politician.portfolioValue,
    trades: politician.trades.map((trade) => {
      const meta = getMockTradeEnrichment(trade.id);
      const filingDate = meta?.filingDate ?? trade.date;

      return {
        id: trade.id,
        ticker: trade.ticker,
        company: trade.company,
        type: trade.type,
        amount: trade.amount,
        tradeDate: trade.date,
        filingDate,
        excessReturn: meta?.excessReturn ?? undefined,
        sector: trade.sector,
      };
    }),
  };
}

function buildProfileFromUnified(
  id: string,
  allTrades: UnifiedCongressTrade[],
  mockPolitician?: Politician,
  source: TradeDataSource = "live"
): PoliticianProfileData | null {
  const politicianTrades = allTrades.filter(
    (trade) =>
      trade.politicianId === id ||
      slugify(trade.politicianName) === id ||
      (mockPolitician != null && trade.politicianId === mockPolitician.id)
  );

  if (politicianTrades.length === 0) {
    return null;
  }

  const first = politicianTrades[0];
  const meta =
    mockPolitician ?? getPoliticianMetadata(first.politicianId);
  const recentTrades = politicianTrades.filter((trade) =>
    isWithinLast90Days(trade.tradeDate)
  );
  const recentReturns = recentTrades
    .map((trade) => trade.excessReturn ?? 0)
    .filter((value) => Number.isFinite(value));

  const sortedTrades = [...politicianTrades].sort(
    (a, b) =>
      new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
  );

  const profileSource: PoliticianProfileData["source"] =
    source === "mock" ? "mock" : "live";

  return {
    id: mockPolitician?.id ?? first.politicianId,
    bioGuideId:
      mockPolitician && mockPolitician.id !== first.politicianId
        ? first.politicianId
        : undefined,
    name: mockPolitician?.name ?? meta?.name ?? first.politicianName,
    party: mockPolitician?.party ?? meta?.party ?? first.party,
    chamber: mockPolitician?.chamber ?? meta?.chamber ?? first.chamber,
    state: mockPolitician?.state ?? meta?.state,
    district: mockPolitician?.district,
    committee: mockPolitician?.committee ?? meta?.committee,
    source: profileSource,
    tradesLast90Days: recentTrades.length,
    totalTrades: politicianTrades.length,
    returnVsSpy:
      meta?.returnVsSpy ?? averageExcessReturn(recentReturns),
    winRate: computeWinRate(recentReturns),
    portfolioValue: mockPolitician?.portfolioValue,
    trades: sortedTrades.map(unifiedToProfileTrade),
  };
}

export async function getPoliticianProfile(
  id: string
): Promise<PoliticianProfileData | null> {
  if (isTrumpProfileId(id)) {
    const profile = await getTrumpProfile();
    return enrichProfileWithLockedSecData(profile);
  }

  const mockPolitician = getPoliticianById(id);
  const { trades, source } = await loadUnifiedTrades();
  const unifiedProfile = buildProfileFromUnified(
    id,
    trades,
    mockPolitician ?? undefined,
    source
  );

  if (unifiedProfile && unifiedProfile.trades.length > 0) {
    return enrichProfileWithLockedSecData(unifiedProfile);
  }

  if (getPreferredCongressProvider() !== "none") {
    try {
      const { trades: liveTrades } = await fetchLiveCongressTrades({
        maxPages: 12,
        lookbackMonths: 18,
      });
      const liveProfile = buildProfileFromUnified(
        id,
        liveTrades,
        mockPolitician ?? undefined,
        "live"
      );

      if (liveProfile) {
        return enrichProfileWithLockedSecData(liveProfile);
      }
    } catch (error) {
      console.error(
        "Live politician profile fetch failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  if (mockPolitician) {
    return enrichProfileWithLockedSecData(buildProfileFromMock(mockPolitician));
  }

  return null;
}

export async function getPoliticianProfileIds(): Promise<string[]> {
  const mockIds = politicians.map((politician) => politician.id);

  if (getPreferredCongressProvider() === "none") {
    return [...mockIds, TRUMP_PROFILE_ID];
  }

  try {
    const { trades } = await fetchLiveCongressTrades({
      maxPages: 12,
      lookbackMonths: 18,
    });
    const liveIds = [...new Set(trades.map((trade) => trade.politicianId))];
    return [...new Set([...mockIds, TRUMP_PROFILE_ID, ...liveIds])];
  } catch {
    return [...mockIds, TRUMP_PROFILE_ID];
  }
}
