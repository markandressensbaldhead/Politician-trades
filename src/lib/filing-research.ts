import { EdgarFiling, FilingInsight, InvestmentSummary, ProfileTrade } from "@/types";
import { generateFilingAnalysis } from "@/lib/claude";
import { prepareFilingsResponse } from "@/lib/filing-utils";
import {
  buildInvestmentSummaries,
  enrichFilingsWithTranslations,
} from "@/lib/filing-translator";
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
import { getStoredFilingsForPolitician } from "@/lib/supabase/sec-filings";
import { syncSecFilingsForPolitician } from "@/lib/sync-sec-filings";

export function formatFilingsForAnalysis(input: {
  politicianName: string;
  trades: ProfileTrade[];
  filings: EdgarFiling[];
}): string {
  const tradeLines = input.trades.slice(0, 25).map((trade, index) => {
    const secNote =
      trade.secFilings && trade.secFilings.length > 0
        ? ` | SEC: ${trade.secFilings
            .slice(0, 2)
            .map((filing) => `${filing.form} (${filing.filedAt})`)
            .join("; ")}`
        : "";

    return `${index + 1}. ${trade.tradeDate} | ${trade.ticker} | ${trade.type} | ${trade.amount} | Filed ${trade.filingDate}${secNote}`;
  });

  const filingLines = input.filings.map((filing, index) => {
    const excerpt = filing.excerpt
      ? `\nExcerpt: ${filing.excerpt.slice(0, 1800)}`
      : "";

    return [
      `${index + 1}. ${filing.form} filed ${filing.filedAt} (${filing.recencyLabel})`,
      `Category: ${filing.categoryLabel}`,
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
  latest: EdgarFiling[];
  grouped: ReturnType<typeof prepareFilingsResponse>["grouped"];
  investments: InvestmentSummary[];
}> {
  const profile = await getPoliticianProfile(politicianId);

  if (!profile) {
    throw new Error("Politician not found");
  }

  if (isSupabaseConfigured()) {
    let stored = await getStoredFilingsForPolitician(politicianId);

    if (stored.length === 0) {
      await syncSecFilingsForPolitician({
        politicianId,
        politicianName: profile.name,
        tickers: [...new Set(profile.trades.map((trade) => trade.ticker))],
      });
      stored = await getStoredFilingsForPolitician(politicianId);
    }

    if (stored.length > 0) {
      const translated = enrichFilingsWithTranslations(
        stored,
        profile.trades,
        profile.name
      );
      const prepared = prepareFilingsResponse(translated);
      const investments = buildInvestmentSummaries(
        profile.name,
        profile.trades,
        prepared.filings
      );

      return {
        politicianName: profile.name,
        trades: profile.trades,
        ...prepared,
        investments,
      };
    }
  }

  const ranked = isTrumpProfileId(politicianId)
    ? await getTrumpFilings()
    : await getFilingsForPolitician({
        politicianName: profile.name,
        tickers: profile.trades.map((trade) => trade.ticker),
      });

  const enrichedTop = await enrichFilingsWithExcerpts(ranked, 5);
  const excerptById = new Map(
    enrichedTop.map((filing) => [filing.id, filing.excerpt])
  );

  const filingsWithExcerpts = ranked.map((filing) => ({
    ...filing,
    excerpt: excerptById.get(filing.id) ?? filing.excerpt,
  }));

  const translated = enrichFilingsWithTranslations(
    filingsWithExcerpts,
    profile.trades,
    profile.name
  );
  const prepared = prepareFilingsResponse(translated);
  const investments = buildInvestmentSummaries(
    profile.name,
    profile.trades,
    prepared.filings
  );

  return {
    politicianName: profile.name,
    trades: profile.trades,
    ...prepared,
    investments,
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
