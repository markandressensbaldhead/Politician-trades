import { PoliticianInsight, PoliticianInsightRow } from "@/types/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function isInsightFresh(generatedAt: string): boolean {
  return Date.now() - new Date(generatedAt).getTime() < ONE_WEEK_MS;
}

export async function getStoredInsight(
  politicianId: string
): Promise<PoliticianInsight | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("politician_insights")
    .select("*")
    .eq("politician_id", politicianId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch insight from Supabase: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as PoliticianInsightRow;

  return {
    politicianId: row.politician_id,
    politicianName: row.politician_name,
    analysis: row.analysis,
    generatedAt: row.generated_at,
    cached: isInsightFresh(row.generated_at),
  };
}

export async function saveInsight(
  politicianId: string,
  politicianName: string,
  analysis: string
): Promise<PoliticianInsight> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("politician_insights")
    .upsert(
      {
        politician_id: politicianId,
        politician_name: politicianName,
        analysis,
        generated_at: now,
        updated_at: now,
      },
      { onConflict: "politician_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save insight to Supabase: ${error.message}`);
  }

  const row = data as PoliticianInsightRow;

  return {
    politicianId: row.politician_id,
    politicianName: row.politician_name,
    analysis: row.analysis,
    generatedAt: row.generated_at,
    cached: false,
  };
}
