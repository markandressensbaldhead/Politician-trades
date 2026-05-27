import { NextResponse } from "next/server";

import { getFilingsBundle } from "@/lib/filing-research";

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

    return NextResponse.json({
      politicianId,
      politicianName: bundle.politicianName,
      filings: bundle.filings,
      count: bundle.filings.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch SEC filings";

    const status = message === "Politician not found" ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
