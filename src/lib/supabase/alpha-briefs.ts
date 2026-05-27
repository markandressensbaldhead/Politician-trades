import { AlphaBriefContent } from "@/types/alpha-brief";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

interface AlphaBriefRow {
  politician_id: string;
  politician_name: string | null;
  brief: AlphaBriefContent;
  trades_in_window: number;
  window_days: number;
  generated_at: string;
  updated_at: string;
}

export interface StoredAlphaBrief {
  politicianId: string;
  politicianName: string;
  brief: AlphaBriefContent;
  tradesInWindow: number;
  windowDays: number;
  generatedAt: string;
  cached: boolean;
}

export function isAlphaBriefFresh(generatedAt: string): boolean {
  return Date.now() - new Date(generatedAt).getTime() < THREE_DAYS_MS;
}

export async function getStoredAlphaBrief(
  politicianId: string
): Promise<StoredAlphaBrief | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("politician_alpha_briefs")
    .select("*")
    .eq("politician_id", politicianId)
    .maybeSingle();

  if (error) {
    if (error.message.includes("politician_alpha_briefs")) {
      return null;
    }

    throw new Error(`Failed to fetch alpha brief: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as AlphaBriefRow;

  return {
    politicianId: row.politician_id,
    politicianName: row.politician_name ?? "",
    brief: row.brief,
    tradesInWindow: row.trades_in_window,
    windowDays: row.window_days,
    generatedAt: row.generated_at,
    cached: isAlphaBriefFresh(row.generated_at),
  };
}

export async function saveAlphaBrief(input: {
  politicianId: string;
  politicianName: string;
  brief: AlphaBriefContent;
  tradesInWindow: number;
  windowDays: number;
}): Promise<StoredAlphaBrief> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("politician_alpha_briefs")
    .upsert(
      {
        politician_id: input.politicianId,
        politician_name: input.politicianName,
        brief: input.brief,
        trades_in_window: input.tradesInWindow,
        window_days: input.windowDays,
        generated_at: now,
        updated_at: now,
      },
      { onConflict: "politician_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save alpha brief: ${error.message}`);
  }

  const row = data as AlphaBriefRow;

  return {
    politicianId: row.politician_id,
    politicianName: row.politician_name ?? input.politicianName,
    brief: row.brief,
    tradesInWindow: row.trades_in_window,
    windowDays: row.window_days,
    generatedAt: row.generated_at,
    cached: false,
  };
}
