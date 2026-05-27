import { NextResponse } from "next/server";

import { getFilingsBundle } from "@/lib/filing-research";
import { getStoredFilingsForPolitician } from "@/lib/supabase/sec-filings";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface RouteParams {
  params: { politician: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const politicianId = decodeURIComponent(params.politician);

  if (!politicianId) {
    return NextResponse.json(
      { error: "Politician ID is required" },
      { status: 400 }
    );
  }

  try {
    const bundle = await getFilingsBundle(politicianId);
    const storedCount = isSupabaseConfigured()
      ? (await getStoredFilingsForPolitician(politicianId)).length
      : 0;

    return NextResponse.json({
      politicianId,
      politicianName: bundle.politicianName,
      filings: bundle.filings,
      latest: bundle.latest,
      grouped: bundle.grouped,
      count: bundle.filings.length,
      locked: storedCount > 0,
      storedCount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch SEC filings";

    const status = message === "Politician not found" ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
