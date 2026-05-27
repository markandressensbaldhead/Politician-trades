import { EdgarFiling, PoliticianProfileData, ProfileTrade, SearchPoliticianEntry } from "@/types";
import { getCompanyFilingsForTicker } from "@/lib/sec-edgar";
import { getMarketQuotes } from "@/lib/yahoo-finance";

export const TRUMP_PROFILE_ID = "donald-trump";

const TRUMP_WATCHLIST = ["DJT", "TSLA", "COIN", "AMZN", "AAPL"];

function getTrumpDisclosedTrades(): ProfileTrade[] {
  return [
    {
      id: "trump-djt-merger",
      ticker: "DJT",
      company: "Trump Media & Technology Group",
      type: "Purchase",
      amount: "Over $50,000,000 (OGE reported value)",
      tradeDate: "2024-03-25",
      filingDate: "2024-08-13",
      sector: "Media / Social",
    },
    {
      id: "trump-djt-oge-2025",
      ticker: "DJT",
      company: "Trump Media & Technology Group",
      type: "Purchase",
      amount: "$5M - $25M (periodic report range)",
      tradeDate: "2025-01-15",
      filingDate: "2025-08-01",
      sector: "Media / Social",
    },
    {
      id: "trump-tsla-oge",
      ticker: "TSLA",
      company: "Tesla, Inc.",
      type: "Purchase",
      amount: "$15,001 - $50,000",
      tradeDate: "2024-12-01",
      filingDate: "2024-08-13",
      sector: "Automotive",
    },
    {
      id: "trump-coin-oge",
      ticker: "COIN",
      company: "Coinbase Global, Inc.",
      type: "Purchase",
      amount: "$1,001 - $15,000",
      tradeDate: "2024-11-10",
      filingDate: "2024-08-13",
      sector: "Financial Services",
    },
    {
      id: "trump-amzn-oge",
      ticker: "AMZN",
      company: "Amazon.com, Inc.",
      type: "Purchase",
      amount: "$1,001 - $15,000",
      tradeDate: "2024-10-05",
      filingDate: "2024-08-13",
      sector: "Consumer",
    },
  ];
}

function enrichTradesWithQuotes(
  trades: ProfileTrade[],
  quotes: Awaited<ReturnType<typeof getMarketQuotes>>
): ProfileTrade[] {
  return trades.map((trade) => {
    const quote = quotes[trade.ticker.toUpperCase()];

    return {
      ...trade,
      excessReturn: quote?.changePercent ?? undefined,
    };
  });
}

export async function getTrumpFilings(): Promise<EdgarFiling[]> {
  const filings = await Promise.all(
    ["DJT", "TSLA"].map((ticker) =>
      getCompanyFilingsForTicker(ticker, 4).catch(() => [])
    )
  );

  const seen = new Set<string>();

  return filings.flat().filter((filing) => {
    if (seen.has(filing.id)) {
      return false;
    }

    seen.add(filing.id);
    return true;
  });
}

export async function getTrumpProfile(): Promise<PoliticianProfileData> {
  const trades = getTrumpDisclosedTrades();
  const tickers = [
    ...new Set([...trades.map((trade) => trade.ticker), ...TRUMP_WATCHLIST]),
  ];
  const [quotes, filings] = await Promise.all([
    getMarketQuotes(tickers),
    getTrumpFilings(),
  ]);

  const enrichedTrades = enrichTradesWithQuotes(trades, quotes);
  const djtQuote = quotes.DJT;
  const recentFilings = filings.filter((filing) => {
    const filedAt = new Date(filing.filedAt);
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return filedAt >= cutoff;
  });

  const excessReturns = enrichedTrades
    .map((trade) => trade.excessReturn ?? 0)
    .filter((value) => Number.isFinite(value));

  const avgReturn =
    excessReturns.length > 0
      ? excessReturns.reduce((sum, value) => sum + value, 0) / excessReturns.length
      : djtQuote?.changePercent ?? 0;

  return {
    id: TRUMP_PROFILE_ID,
    name: "Donald J. Trump",
    party: "Republican",
    chamber: "Executive",
    state: "FL",
    officeTitle: "President of the United States",
    committee: "Executive Branch · OGE Financial Disclosures",
    source: "disclosure",
    tradesLast90Days: recentFilings.length + 1,
    totalTrades: enrichedTrades.length,
    returnVsSpy: avgReturn,
    winRate:
      excessReturns.length > 0
        ? (excessReturns.filter((value) => value > 0).length / excessReturns.length) *
          100
        : undefined,
    portfolioValue: djtQuote?.price
      ? Math.round(djtQuote.price * 114_750_000)
      : undefined,
    trades: enrichedTrades,
  };
}

export async function getTrumpSpotlightData() {
  const [profile, filings, quotes] = await Promise.all([
    getTrumpProfile(),
    getTrumpFilings(),
    getMarketQuotes(["DJT"]),
  ]);

  const djt = quotes.DJT;

  return {
    profile,
    djtPrice: djt?.price ?? null,
    djtChange: djt?.changePercent ?? null,
    djtName: djt?.shortName ?? "Trump Media & Technology Group",
    filingCount: filings.length,
    disclosedPositions: profile.trades.length,
  };
}

export function getTrumpSearchEntry(): SearchPoliticianEntry {
  return {
    id: TRUMP_PROFILE_ID,
    name: "Donald J. Trump",
    party: "Republican",
    chamber: "Executive",
    state: "FL",
    committee: "President · OGE Financial Disclosures",
    tradesLast90Days: 5,
    totalTrades: 5,
    returnVsSpy: 0,
    source: "disclosure",
  };
}

export function isTrumpProfileId(id: string): boolean {
  return id === TRUMP_PROFILE_ID || id === "donald-j-trump";
}
