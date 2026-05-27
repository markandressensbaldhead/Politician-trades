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
  mapChamber,
  mapParty,
  slugify,
} from "@/lib/quiver-mappers";
import {
  fetchCongressTrades,
  normalizeTradeType,
  QuiverCongressTrade,
} from "@/lib/quiverquant";
import { loadUnifiedTrades, TradeDataSource } from "@/lib/unified-trades";

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

function quiverTradeToProfileTrade(
  trade: QuiverCongressTrade,
  index: number
): ProfileTrade {
  const tradeType = normalizeTradeType(trade.Transaction);

  return {
    id: `${trade.BioGuideID}-${trade.TransactionDate}-${trade.Ticker}-${index}`,
    ticker: trade.Ticker,
    company: trade.Description?.trim() || trade.Ticker,
    type: tradeType === "buy" ? "Purchase" : "Sale",
    amount: trade.Range,
    tradeDate: trade.TransactionDate,
    filingDate: trade.ReportDate,
    excessReturn: trade.ExcessReturn,
    priceChange: trade.PriceChange ?? null,
    spyChange: trade.SPYChange ?? null,
    sector: trade.TickerType,
  };
}

function buildProfileFromTrades(
  id: string,
  trades: QuiverCongressTrade[]
): PoliticianProfileData | null {
  const politicianTrades = trades.filter(
    (trade) =>
      trade.BioGuideID === id || slugify(trade.Representative) === id
  );

  if (politicianTrades.length === 0) {
    return null;
  }

  const first = politicianTrades[0];
  const recentTrades = politicianTrades.filter((trade) =>
    isWithinLast90Days(trade.TransactionDate)
  );
  const recentReturns = recentTrades
    .map((trade) => trade.ExcessReturn ?? 0)
    .filter((value) => Number.isFinite(value));

  const sortedTrades = [...politicianTrades].sort(
    (a, b) =>
      new Date(b.TransactionDate).getTime() -
      new Date(a.TransactionDate).getTime()
  );

  return {
    id: first.BioGuideID || id,
    bioGuideId: first.BioGuideID,
    name: first.Representative,
    party: mapParty(first.Party),
    chamber: mapChamber(first.House),
    source: "live",
    tradesLast90Days: recentTrades.length,
    totalTrades: politicianTrades.length,
    returnVsSpy: averageExcessReturn(recentReturns),
    winRate: computeWinRate(recentReturns),
    trades: sortedTrades.map(quiverTradeToProfileTrade),
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

  const apiKey = process.env.QUIVERQUANT_API_KEY;

  if (apiKey) {
    try {
      const liveTrades = await fetchCongressTrades(apiKey);
      const liveProfile = buildProfileFromTrades(id, liveTrades);

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

  const apiKey = process.env.QUIVERQUANT_API_KEY;
  if (!apiKey) {
    return [...mockIds, TRUMP_PROFILE_ID];
  }

  try {
    const trades = await fetchCongressTrades(apiKey);
    const liveIds = [
      ...new Set(
        trades.map((trade) => trade.BioGuideID || slugify(trade.Representative))
      ),
    ];
    return [...new Set([...mockIds, TRUMP_PROFILE_ID, ...liveIds])];
  } catch {
    return [...mockIds, TRUMP_PROFILE_ID];
  }
}
