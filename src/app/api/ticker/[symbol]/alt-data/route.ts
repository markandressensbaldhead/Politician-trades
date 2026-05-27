import { NextResponse } from "next/server";

import { fetchCapitolTradesByTicker } from "@/lib/capitol-trades";
import { fetchFmpTickerTrades } from "@/lib/fmp-congress";
import { fetchQuiverTickerAltData } from "@/lib/quiver-alt-data";

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  const ticker = params.symbol?.trim().toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  const [altData, fmpHouse, fmpSenate, capitolTrades] = await Promise.all([
    fetchQuiverTickerAltData(ticker),
    fetchFmpTickerTrades(ticker, "House").catch(() => []),
    fetchFmpTickerTrades(ticker, "Senate").catch(() => []),
    fetchCapitolTradesByTicker(ticker, 50).catch(() => []),
  ]);

  return NextResponse.json({
    ticker,
    altData,
    fmp: {
      house: fmpHouse,
      senate: fmpSenate,
    },
    capitolTrades,
  });
}
