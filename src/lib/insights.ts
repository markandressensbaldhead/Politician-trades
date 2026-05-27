import { buildAlphaContextBlock } from "@/lib/alpha-brief-analytics";
import { generateTradeAnalysis } from "@/lib/claude";
import { getPoliticianProfile } from "@/lib/politician";
import {
  getStoredInsight,
  isInsightFresh,
  saveInsight,
} from "@/lib/supabase/insights";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  formatTradesForAnalysis,
  getTradesForPolitician,
  profileTradesToCongressRows,
  syncPoliticianTradesIfMissing,
} from "@/lib/supabase/trades";
import { CongressTradeRow, PoliticianInsight } from "@/types/supabase";

function uniqueIds(...values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

async function loadStoredTrades(ids: string[]): Promise<CongressTradeRow[]> {
  for (const id of ids) {
    const trades = await getTradesForPolitician(id, 100);
    if (trades.length > 0) {
      return trades;
    }
  }

  return [];
}

async function ensureTradesForAnalysis(politicianId: string) {
  const profile = await getPoliticianProfile(politicianId);

  if (!profile) {
    return null;
  }

  const storageId = profile.bioGuideId ?? profile.id;
  const lookupIds = uniqueIds(politicianId, profile.id, profile.bioGuideId);
  let trades = await loadStoredTrades(lookupIds);

  if (trades.length === 0 && profile.trades.length > 0) {
    try {
      await syncPoliticianTradesIfMissing(
        storageId,
        profile.name,
        profile.trades.slice(0, 100)
      );
    } catch {
      // Another request may have inserted these rows already.
    }

    trades = await loadStoredTrades(lookupIds);
  }

  if (trades.length === 0 && profile.trades.length > 0) {
    trades = profileTradesToCongressRows(
      storageId,
      profile.name,
      profile.trades
    );
  }

  return { profile, trades };
}

export async function getOrGenerateInsight(
  politicianId: string,
  options?: { forceRefresh?: boolean }
): Promise<PoliticianInsight> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  if (!options?.forceRefresh) {
    const stored = await getStoredInsight(politicianId);

    if (stored && isInsightFresh(stored.generatedAt)) {
      return { ...stored, cached: true };
    }
  }

  const result = await ensureTradesForAnalysis(politicianId);

  if (!result) {
    throw new Error("Politician not found");
  }

  const { profile, trades } = result;

  if (trades.length === 0) {
    throw new Error("No trades available for analysis");
  }

  const analyticsContext = buildAlphaContextBlock(
    trades,
    profile.committee,
    30
  );
  const tradeHistoryText = [
    "=== ANALYTICS CONTEXT (pre-computed — use this for sector flow, net direction, and top excess-return names) ===",
    analyticsContext,
    "",
    "=== RAW TRADE HISTORY ===",
    formatTradesForAnalysis(
      profile.name,
      profile.party,
      profile.chamber,
      profile.committee,
      trades
    ),
  ].join("\n");

  const analysis = await generateTradeAnalysis(tradeHistoryText, profile.name);

  return saveInsight(politicianId, profile.name, analysis);
}
