import { NextResponse } from "next/server";

import {
  fetchCongressTrades,
  parseCongressTrades,
} from "@/lib/quiverquant";

export async function GET() {
  const apiKey = process.env.QUIVERQUANT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "QUIVERQUANT_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const rawTrades = await fetchCongressTrades(apiKey);
    const trades = parseCongressTrades(rawTrades);

    return NextResponse.json({
      trades,
      count: trades.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trade data";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
