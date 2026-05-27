import { NextResponse } from "next/server";

import { getOrGenerateAlphaBrief } from "@/lib/alpha-brief";

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
    const brief = await getOrGenerateAlphaBrief(politicianId, {
      forceRefresh: refresh,
    });

    return NextResponse.json(brief);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate alpha brief";

    const status =
      message === "Politician not found"
        ? 404
        : message.includes("not configured")
          ? 503
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
