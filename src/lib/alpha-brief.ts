import {
  ALPHA_BRIEF_WINDOW_DAYS,
  buildAlphaContextBlock,
  filterTradesInWindow,
} from "@/lib/alpha-brief-analytics";
import { generateAlphaBrief, parseAlphaBriefJson } from "@/lib/claude";
import { getPoliticianProfile } from "@/lib/politician";
import {
  getStoredAlphaBrief,
  isAlphaBriefFresh,
  saveAlphaBrief,
} from "@/lib/supabase/alpha-briefs";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  formatTradesForAnalysis,
  getTradesForPolitician,
  profileTradesToCongressRows,
  syncPoliticianTradesIfMissing,
} from "@/lib/supabase/trades";
import { PoliticianAlphaBrief } from "@/types/alpha-brief";
import { CongressTradeRow } from "@/types/supabase";

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

export async function getOrGenerateAlphaBrief(
  politicianId: string,
  options?: { forceRefresh?: boolean }
): Promise<PoliticianAlphaBrief> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  if (!options?.forceRefresh) {
    const stored = await getStoredAlphaBrief(politicianId);

    if (stored && isAlphaBriefFresh(stored.generatedAt)) {
      return {
        politicianId: stored.politicianId,
        politicianName: stored.politicianName,
        brief: stored.brief,
        tradesInWindow: stored.tradesInWindow,
        windowDays: stored.windowDays,
        generatedAt: stored.generatedAt,
        cached: true,
      };
    }
  }

  const result = await ensureTradesForAnalysis(politicianId);

  if (!result) {
    throw new Error("Politician not found");
  }

  const { profile, trades } = result;

  if (trades.length === 0) {
    throw new Error("No trades available for alpha brief");
  }

  const recentTrades = filterTradesInWindow(trades, ALPHA_BRIEF_WINDOW_DAYS);
  const tradesForPrompt =
    recentTrades.length > 0 ? recentTrades : trades.slice(0, 15);

  const contextBlock = buildAlphaContextBlock(
    trades,
    profile.committee,
    ALPHA_BRIEF_WINDOW_DAYS
  );

  const tradeHistoryText = formatTradesForAnalysis(
    profile.name,
    profile.party,
    profile.chamber,
    profile.committee,
    tradesForPrompt
  );

  const rawJson = await generateAlphaBrief({
    politicianName: profile.name,
    party: profile.party,
    chamber: profile.chamber,
    committee: profile.committee,
    contextBlock,
    tradeHistoryText,
    tradesInWindow: recentTrades.length,
    windowDays: ALPHA_BRIEF_WINDOW_DAYS,
  });

  const brief = parseAlphaBriefJson(rawJson);

  try {
    const saved = await saveAlphaBrief({
      politicianId,
      politicianName: profile.name,
      brief,
      tradesInWindow: recentTrades.length,
      windowDays: ALPHA_BRIEF_WINDOW_DAYS,
    });

    return {
      politicianId: saved.politicianId,
      politicianName: saved.politicianName,
      brief: saved.brief,
      tradesInWindow: saved.tradesInWindow,
      windowDays: saved.windowDays,
      generatedAt: saved.generatedAt,
      cached: false,
    };
  } catch {
    return {
      politicianId,
      politicianName: profile.name,
      brief,
      tradesInWindow: recentTrades.length,
      windowDays: ALPHA_BRIEF_WINDOW_DAYS,
      generatedAt: new Date().toISOString(),
      cached: false,
    };
  }
}
