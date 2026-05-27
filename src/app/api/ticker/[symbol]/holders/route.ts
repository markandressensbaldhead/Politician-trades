import { NextResponse } from "next/server";

import {
  fetchPoliticianHoldersByTicker,
  isUnusualWhalesConfigured,
} from "@/lib/unusual-whales";

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  const ticker = params.symbol?.trim().toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  if (!isUnusualWhalesConfigured()) {
    return NextResponse.json(
      { configured: false, holders: [], ticker },
      { status: 503 }
    );
  }

  try {
    const holders = await fetchPoliticianHoldersByTicker(ticker, true);
    return NextResponse.json({
      configured: true,
      ticker,
      holders,
      source: "unusual_whales",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch ticker holders";

    return NextResponse.json(
      { configured: true, ticker, error: message, holders: [] },
      { status: 502 }
    );
  }
}
