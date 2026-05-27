import { NextResponse } from "next/server";

import { getOrGenerateAlphaBrief } from "@/lib/alpha-brief";
import { getOrGenerateInsight } from "@/lib/insights";

interface RouteParams {
  params: { politician: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const politicianId = decodeURIComponent(params.politician);
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const alpha = url.searchParams.get("alpha") === "1";

  if (!politicianId) {
    return NextResponse.json(
      { error: "Politician ID is required" },
      { status: 400 }
    );
  }

  try {
    if (alpha) {
      const brief = await getOrGenerateAlphaBrief(politicianId, {
        forceRefresh: refresh,
      });

      return NextResponse.json(brief);
    }

    const insight = await getOrGenerateInsight(politicianId, {
      forceRefresh: refresh,
    });

    return NextResponse.json({
      politicianId: insight.politicianId,
      politicianName: insight.politicianName,
      analysis: insight.analysis,
      generatedAt: insight.generatedAt,
      cached: insight.cached,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate insight";

    const status =
      message === "Politician not found"
        ? 404
        : message.includes("not configured")
          ? 503
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
