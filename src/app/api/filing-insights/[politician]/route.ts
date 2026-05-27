import { NextResponse } from "next/server";

import { getOrGenerateFilingInsight } from "@/lib/filing-research";

interface RouteParams {
  params: { politician: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const politicianId = decodeURIComponent(params.politician);
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";

  if (!politicianId) {
    return NextResponse.json(
      { error: "Politician ID is required" },
      { status: 400 }
    );
  }

  try {
    const insight = await getOrGenerateFilingInsight(politicianId, {
      forceRefresh: refresh,
    });

    return NextResponse.json(insight);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate filing insight";

    const status =
      message === "Politician not found"
        ? 404
        : message.includes("not configured")
          ? 503
          : message.includes("No SEC filings")
            ? 404
            : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
