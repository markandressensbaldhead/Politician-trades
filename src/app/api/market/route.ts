import { NextResponse } from "next/server";

import { getMarketQuotes } from "@/lib/yahoo-finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers");

  if (!tickersParam) {
    return NextResponse.json(
      { error: "tickers query parameter is required" },
      { status: 400 }
    );
  }

  const tickers = tickersParam
    .split(",")
    .map((ticker) => ticker.trim())
    .filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json({ quotes: {} });
  }

  try {
    const quotes = await getMarketQuotes(tickers.slice(0, 25));
    return NextResponse.json({ quotes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch market data";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
