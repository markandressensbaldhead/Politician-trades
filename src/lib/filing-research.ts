import { EdgarFiling, FilingInsight, ProfileTrade } from "@/types";
import { generateFilingAnalysis } from "@/lib/claude";
import { getPoliticianProfile } from "@/lib/politician";
import {
  enrichFilingsWithExcerpts,
  getFilingsForPolitician,
} from "@/lib/sec-edgar";
import {
  getTrumpFilings,
  isTrumpProfileId,
} from "@/lib/trump-data";
import {
  getStoredFilingInsight,
  isFilingInsightFresh,
  saveFilingInsight,
} from "@/lib/supabase/filing-insights";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export function formatFilingsForAnalysis(input: {
  politicianName: string;
  trades: ProfileTrade[];
  filings: EdgarFiling[];
}): string {
  const tradeLines = input.trades.slice(0, 25).map((trade, index) => {
    return `${index + 1}. ${trade.tradeDate} | ${trade.ticker} | ${trade.type} | ${trade.amount} | Filed ${trade.filingDate}`;
  });

  const filingLines = input.filings.map((filing, index) => {
    const excerpt = filing.excerpt
      ? `\nExcerpt: ${filing.excerpt.slice(0, 1800)}`
      : "";

    return [
      `${index + 1}. ${filing.form} filed ${filing.filedAt}`,
      `Entity: ${filing.entityName}`,
      filing.ticker ? `Ticker: ${filing.ticker}` : null,
      `Source: ${filing.source}`,
      `URL: ${filing.documentUrl}`,
      excerpt,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    `Politician: ${input.politicianName}`,
    "",
    "Known disclosed trades:",
    tradeLines.join("\n") || "None provided",
    "",
    "SEC EDGAR filings reviewed:",
    filingLines.join("\n\n") || "No filings found",
  ].join("\n");
}

export async function getFilingsBundle(politicianId: string): Promise<{
  politicianName: string;
  trades: ProfileTrade[];
  filings: EdgarFiling[];
}> {
  const profile = await getPoliticianProfile(politicianId);

  if (!profile) {
    throw new Error("Politician not found");
  }

  const filings = isTrumpProfileId(politicianId)
    ? await getTrumpFilings()
    : await getFilingsForPolitician({
        politicianName: profile.name,
        tickers: profile.trades.map((trade) => trade.ticker),
      });

  const enriched = await enrichFilingsWithExcerpts(filings, 4);

  return {
    politicianName: profile.name,
    trades: profile.trades,
    filings: enriched,
  };
}

export async function getOrGenerateFilingInsight(
  politicianId: string
): Promise<FilingInsight> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  if (isSupabaseConfigured()) {
    const stored = await getStoredFilingInsight(politicianId);

    if (stored && isFilingInsightFresh(stored.generatedAt)) {
      return { ...stored, cached: true };
    }
  }

  const bundle = await getFilingsBundle(politicianId);

  if (bundle.filings.length === 0) {
    throw new Error("No SEC filings found for this politician");
  }

  const context = formatFilingsForAnalysis({
    politicianName: bundle.politicianName,
    trades: bundle.trades,
    filings: bundle.filings,
  });

  const analysis = await generateFilingAnalysis(context, bundle.politicianName);

  if (isSupabaseConfigured()) {
    return saveFilingInsight(
      politicianId,
      bundle.politicianName,
      analysis,
      bundle.filings.length
    );
  }

  return {
    politicianId,
    politicianName: bundle.politicianName,
    analysis,
    generatedAt: new Date().toISOString(),
    cached: false,
    filingsReviewed: bundle.filings.length,
  };
}
