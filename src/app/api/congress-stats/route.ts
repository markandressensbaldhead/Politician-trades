import { NextResponse } from "next/server";

import {
  fetchCongressUnusualTradeStats,
  isUnusualWhalesConfigured,
} from "@/lib/unusual-whales";

export async function GET() {
  if (!isUnusualWhalesConfigured()) {
    return NextResponse.json(
      { configured: false, error: "UNUSUAL_WHALES_API_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    const stats = await fetchCongressUnusualTradeStats();
    return NextResponse.json({
      configured: true,
      stats,
      source: "unusual_whales",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch congress stats";

    return NextResponse.json({ configured: true, error: message }, { status: 502 });
  }
}
