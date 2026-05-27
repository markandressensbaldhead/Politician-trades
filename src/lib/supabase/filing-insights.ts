import { FilingInsight } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface FilingInsightRow {
  politician_id: string;
  politician_name: string | null;
  analysis: string;
  filings_reviewed: number;
  generated_at: string;
  updated_at: string;
}

export function isFilingInsightFresh(generatedAt: string): boolean {
  return Date.now() - new Date(generatedAt).getTime() < ONE_WEEK_MS;
}

export async function getStoredFilingInsight(
  politicianId: string
): Promise<FilingInsight | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("politician_filing_insights")
    .select("*")
    .eq("politician_id", politicianId)
    .maybeSingle();

  if (error) {
    if (error.message.includes("politician_filing_insights")) {
      return null;
    }

    throw new Error(`Failed to fetch filing insight: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as FilingInsightRow;

  return {
    politicianId: row.politician_id,
    politicianName: row.politician_name ?? "",
    analysis: row.analysis,
    generatedAt: row.generated_at,
    cached: isFilingInsightFresh(row.generated_at),
    filingsReviewed: row.filings_reviewed,
  };
}

export async function saveFilingInsight(
  politicianId: string,
  politicianName: string,
  analysis: string,
  filingsReviewed: number
): Promise<FilingInsight> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("politician_filing_insights")
    .upsert(
      {
        politician_id: politicianId,
        politician_name: politicianName,
        analysis,
        filings_reviewed: filingsReviewed,
        generated_at: now,
        updated_at: now,
      },
      { onConflict: "politician_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save filing insight: ${error.message}`);
  }

  const row = data as FilingInsightRow;

  return {
    politicianId: row.politician_id,
    politicianName: row.politician_name ?? politicianName,
    analysis: row.analysis,
    generatedAt: row.generated_at,
    cached: false,
    filingsReviewed: row.filings_reviewed,
  };
}
