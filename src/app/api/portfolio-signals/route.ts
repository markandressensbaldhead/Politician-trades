import { NextResponse } from "next/server";

import { loadUnifiedTrades } from "@/lib/unified-trades";
import { getPortfolioCongressSignals } from "@/lib/portfolio-signals";
import { PortfolioHolding } from "@/types/portfolio";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { holdings?: PortfolioHolding[] };
    const holdings = body.holdings ?? [];

    if (holdings.length === 0) {
      return NextResponse.json(
        { error: "Add at least one holding." },
        { status: 400 }
      );
    }

    const { trades } = await loadUnifiedTrades();
    const signals = getPortfolioCongressSignals(holdings, trades);

    return NextResponse.json(signals);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to compute signals";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
