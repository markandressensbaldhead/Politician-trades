import { NextResponse } from "next/server";

import { buildPortfolioAdvice } from "@/lib/portfolio-advice";
import { PortfolioHolding } from "@/types/portfolio";

function sanitizeHoldings(raw: unknown): PortfolioHolding[] {
  if (!Array.isArray(raw)) return [];

  const holdings: PortfolioHolding[] = [];

  for (const item of raw) {
    const row = item as Record<string, unknown>;
    const ticker = String(row.ticker ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9.]/g, "");
    const quantity = Number(row.quantity);

    if (!ticker || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    const averageCostRaw = row.averageCost;
    const averageCost =
      averageCostRaw == null || averageCostRaw === ""
        ? null
        : Number(averageCostRaw);

    holdings.push({
      ticker,
      quantity: Number(quantity.toFixed(4)),
      averageCost:
        averageCost != null && Number.isFinite(averageCost)
          ? Number(averageCost.toFixed(2))
          : null,
      source: row.source === "robinhood_csv" ? "robinhood_csv" : "manual",
    });
  }

  return holdings.slice(0, 100);
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI portfolio advice is not configured (ANTHROPIC_API_KEY)." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const holdings = sanitizeHoldings(body.holdings);

    if (holdings.length === 0) {
      return NextResponse.json(
        { error: "At least one valid holding is required." },
        { status: 400 }
      );
    }

    const result = await buildPortfolioAdvice(holdings);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate portfolio advice";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
