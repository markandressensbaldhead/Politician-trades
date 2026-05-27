import { NextResponse } from "next/server";

import {
  fetchLiveCongressTrades,
  getPreferredCongressProvider,
} from "@/lib/congress-trade-source";

export async function GET() {
  const provider = getPreferredCongressProvider();

  if (provider === "none") {
    return NextResponse.json(
      {
        error:
          "Configure UNUSUAL_WHALES_API_KEY or QUIVERQUANT_API_KEY for live trade data",
      },
      { status: 503 }
    );
  }

  try {
    const { trades, provider: resolvedProvider } = await fetchLiveCongressTrades({
      maxPages: 12,
      lookbackMonths: 18,
    });

    return NextResponse.json({
      trades,
      count: trades.length,
      provider: resolvedProvider,
      source: resolvedProvider,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trade data";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
