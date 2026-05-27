import { EdgarFiling, PoliticianProfileData, ProfileTrade, SearchPoliticianEntry } from "@/types";
import {
  getCompanyFilingsForTicker,
  searchCompanyFilingsByName,
} from "@/lib/sec-edgar";
import { rankFilings } from "@/lib/filing-utils";
import { getStoredFilingsForPolitician } from "@/lib/supabase/sec-filings";
import { getMarketQuotes } from "@/lib/yahoo-finance";

export const TRUMP_PROFILE_ID = "donald-trump";

/** Public share count cited in DJT SEC registration/proxy materials (~59% ownership). */
const TRUMP_DJT_SHARES = 114_750_000;

function getTrumpDisclosures(): ProfileTrade[] {
  return [
    {
      id: "trump-djt-holding-2024",
      ticker: "DJT",
      company: "Trump Media & Technology Group",
      type: "Reported Holding",
      amount: "$50,000,001 – $100,000,000 (OGE asset range)",
      tradeDate: "2023-12-31",
      filingDate: "2024-08-13",
      sector: "Media / Social",
      disclosureType: "reported-holding",
      sourceNote: "OGE Form 278e annual report, certified Aug 13, 2024",
    },
    {
      id: "trump-djt-merger-2024",
      ticker: "DJT",
      company: "Trump Media & Technology Group",
      type: "Corporate Event",
      amount: "SPAC merger consideration (DWAC → DJT)",
      tradeDate: "2024-03-25",
      filingDate: "2024-03-25",
      sector: "Media / Social",
      disclosureType: "corporate-event",
      sourceNote: "Trump Media & Digital World Acquisition Corp. merger close",
    },
    {
      id: "trump-djt-lockup-2024",
      ticker: "DJT",
      company: "Trump Media & Technology Group",
      type: "Reported Transaction",
      amount: "$100,000,001 – $1,000,000,000 (OGE sale range)",
      tradeDate: "2024-10-29",
      filingDate: "2024-10-29",
      sector: "Media / Social",
      disclosureType: "transaction",
      sourceNote:
        "Periodic transaction report filed Oct 29, 2024 for trust sale of DJT shares",
    },
    {
      id: "trump-crypto-income-2024",
      ticker: "BTC",
      company: "Bitcoin (via licensing / crypto ventures)",
      type: "Reported Income",
      amount: "$50,000,001 – $100,000,000 (OGE income range)",
      tradeDate: "2023-12-31",
      filingDate: "2024-08-13",
      sector: "Digital Assets",
      disclosureType: "reported-holding",
      sourceNote:
        "OGE Form 278e — crypto-related licensing income (not an exchange trade)",
    },
  ];
}

function enrichDisclosuresWithQuotes(
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
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");

  if (isSupabaseConfigured()) {
    const stored = await getStoredFilingsForPolitician(TRUMP_PROFILE_ID);

    if (stored.length > 0) {
      return stored;
    }
  }

  const [djtFilings, djtSearchFilings] = await Promise.all([
    getCompanyFilingsForTicker("DJT", 15).catch(() => []),
    searchCompanyFilingsByName("Trump Media & Technology Group", 8).catch(
      () => []
    ),
  ]);

  const seen = new Set<string>();
  const combined = [...djtFilings, ...djtSearchFilings].filter((filing) => {
    if (seen.has(filing.id)) {
      return false;
    }

    seen.add(filing.id);
    return true;
  });

  return rankFilings(combined);
}

export async function getTrumpProfile(): Promise<PoliticianProfileData> {
  const disclosures = getTrumpDisclosures();
  const tickers = ["DJT", "BTC"];

  const [quotes, filings] = await Promise.all([
    getMarketQuotes(tickers),
    getTrumpFilings(),
  ]);

  const enrichedDisclosures = enrichDisclosuresWithQuotes(disclosures, quotes);
  const djtQuote = quotes.DJT;

  const recentFilings = filings.filter((filing) => filing.daysAgo <= 90);
  const djtReturns = djtQuote?.changePercent != null ? [djtQuote.changePercent] : [];

  const sortedDisclosures = [...enrichedDisclosures].sort(
    (a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime()
  );

  return {
    id: TRUMP_PROFILE_ID,
    name: "Donald J. Trump",
    party: "Republican",
    chamber: "Executive",
    state: "FL",
    officeTitle: "President of the United States",
    committee: "Executive Branch · OGE Form 278e disclosures",
    source: "disclosure",
    tradesLast90Days: recentFilings.length,
    totalTrades: sortedDisclosures.length,
    returnVsSpy: djtReturns[0] ?? 0,
    portfolioValue:
      djtQuote?.price != null
        ? Math.round(djtQuote.price * TRUMP_DJT_SHARES)
        : undefined,
    trades: sortedDisclosures,
  };
}

export async function getTrumpSpotlightData() {
  const [profile, filings, quotes] = await Promise.all([
    getTrumpProfile(),
    getTrumpFilings(),
    getMarketQuotes(["DJT"]),
  ]);

  const djt = quotes.DJT;
  const ranked = rankFilings(filings);
  const latest = ranked.filter((filing) => filing.isFeatured).slice(0, 3);

  return {
    profile,
    djtPrice: djt?.price ?? null,
    djtChange: djt?.changePercent ?? null,
    djtName: djt?.shortName ?? "Trump Media & Technology Group",
    filingCount: ranked.length,
    disclosedPositions: profile.trades.length,
    latestFilings: latest,
    estimatedStakeValue:
      djt?.price != null ? Math.round(djt.price * TRUMP_DJT_SHARES) : null,
  };
}

export async function getTrumpSearchEntry(): Promise<SearchPoliticianEntry> {
  const profile = await getTrumpProfile();

  return {
    id: TRUMP_PROFILE_ID,
    name: "Donald J. Trump",
    party: "Republican",
    chamber: "Executive",
    state: "FL",
    committee: "President · OGE Form 278e",
    tradesLast90Days: profile.tradesLast90Days,
    totalTrades: profile.totalTrades,
    returnVsSpy: profile.returnVsSpy,
    source: "disclosure",
  };
}

export function isTrumpProfileId(id: string): boolean {
  return id === TRUMP_PROFILE_ID || id === "donald-j-trump";
}
