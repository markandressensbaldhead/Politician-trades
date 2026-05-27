import { NextResponse } from "next/server";

import {
  fetchSnapTradeHoldings,
  isSnapTradeConfigured,
} from "@/lib/snaptrade-client";
import { PortfolioHolding } from "@/types/portfolio";

export async function POST(request: Request) {
  if (!isSnapTradeConfigured()) {
    return NextResponse.json(
      { error: "SnapTrade is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const userId = body.userId?.trim();
    const userSecret = body.userSecret?.trim();

    if (!userId || !userSecret) {
      return NextResponse.json(
        { error: "userId and userSecret are required" },
        { status: 400 }
      );
    }

    const positions = await fetchSnapTradeHoldings({ userId, userSecret });

    const holdings: PortfolioHolding[] = positions.map((position) => ({
      ticker: position.ticker,
      quantity: position.quantity,
      averageCost: position.averageCost,
      source: "snaptrade",
    }));

    return NextResponse.json({
      holdings,
      syncedAt: new Date().toISOString(),
      accountLabel:
        positions[0]?.accountName ?? "Robinhood via SnapTrade",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Robinhood holdings";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
