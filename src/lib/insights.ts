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
  syncPoliticianTradesIfMissing,
} from "@/lib/supabase/trades";
import { PoliticianInsight } from "@/types/supabase";

async function ensureTradesInSupabase(politicianId: string) {
  const profile = await getPoliticianProfile(politicianId);

  if (!profile) {
    return null;
  }

  let trades = await getTradesForPolitician(politicianId, 100);

  if (trades.length === 0 && profile.trades.length > 0) {
    await syncPoliticianTradesIfMissing(
      politicianId,
      profile.name,
      profile.trades.slice(0, 100)
    );
    trades = await getTradesForPolitician(politicianId, 100);
  }

  return { profile, trades };
}

export async function getOrGenerateInsight(
  politicianId: string
): Promise<PoliticianInsight> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  const stored = await getStoredInsight(politicianId);

  if (stored && isInsightFresh(stored.generatedAt)) {
    return { ...stored, cached: true };
  }

  const result = await ensureTradesInSupabase(politicianId);

  if (!result) {
    throw new Error("Politician not found");
  }

  const { profile, trades } = result;

  if (trades.length === 0) {
    throw new Error("No trades available for analysis");
  }

  const tradeHistoryText = formatTradesForAnalysis(
    profile.name,
    profile.party,
    profile.chamber,
    profile.committee,
    trades
  );

  const analysis = await generateTradeAnalysis(tradeHistoryText, profile.name);

  return saveInsight(politicianId, profile.name, analysis);
}
