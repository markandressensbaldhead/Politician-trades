import { CongressTradeRow } from "@/types/supabase";

export const ALPHA_BRIEF_WINDOW_DAYS = 30;

export function filterTradesInWindow(
  trades: CongressTradeRow[],
  days = ALPHA_BRIEF_WINDOW_DAYS
): CongressTradeRow[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return trades.filter(
    (trade) => new Date(trade.trade_date).getTime() >= cutoff
  );
}

export function buildAlphaContextBlock(
  trades: CongressTradeRow[],
  committee: string | undefined,
  days = ALPHA_BRIEF_WINDOW_DAYS
): string {
  const recent = filterTradesInWindow(trades, days);
  const purchases = recent.filter((trade) => trade.trade_type === "Purchase");
  const sales = recent.filter((trade) => trade.trade_type !== "Purchase");

  const byTicker = new Map<
    string,
    { purchases: number; sales: number; bestExcess: number | null; lastDate: string }
  >();

  for (const trade of recent) {
    const ticker = trade.ticker.toUpperCase();
    const bucket = byTicker.get(ticker) ?? {
      purchases: 0,
      sales: 0,
      bestExcess: null,
      lastDate: trade.trade_date,
    };

    if (trade.trade_type === "Purchase") {
      bucket.purchases += 1;
    } else {
      bucket.sales += 1;
    }

    if (
      trade.excess_return != null &&
      (bucket.bestExcess == null || trade.excess_return > bucket.bestExcess)
    ) {
      bucket.bestExcess = trade.excess_return;
    }

    if (trade.trade_date > bucket.lastDate) {
      bucket.lastDate = trade.trade_date;
    }

    byTicker.set(ticker, bucket);
  }

  const sectorCounts = new Map<string, number>();
  for (const trade of recent) {
    if (!trade.sector) continue;
    sectorCounts.set(trade.sector, (sectorCounts.get(trade.sector) ?? 0) + 1);
  }

  const topExcess = recent
    .filter((trade) => trade.excess_return != null)
    .sort((a, b) => (b.excess_return ?? 0) - (a.excess_return ?? 0))
    .slice(0, 5);

  const lines = [
    `Analysis window: last ${days} days (trade date)`,
    `Trades in window: ${recent.length}`,
    `Purchases: ${purchases.length} | Sales: ${sales.length}`,
    committee ? `Committee jurisdiction: ${committee}` : "Committee: not provided",
    "",
    "Tickers with activity in window:",
  ];

  if (byTicker.size === 0) {
    lines.push("- None — no disclosed trades in the last 30 days.");
  } else {
    for (const [ticker, stats] of [...byTicker.entries()].slice(0, 12)) {
      lines.push(
        `- ${ticker}: ${stats.purchases} buy / ${stats.sales} sell | last ${stats.lastDate}${
          stats.bestExcess != null
            ? ` | best excess vs SPY ${stats.bestExcess.toFixed(2)}%`
            : ""
        }`
      );
    }
  }

  if (sectorCounts.size > 0) {
    lines.push("", "Sector concentration (30d):");
    for (const [sector, count] of [...sectorCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )) {
      lines.push(`- ${sector}: ${count} trades`);
    }
  }

  if (topExcess.length > 0) {
    lines.push("", "Top excess-return trades in window:");
    for (const trade of topExcess) {
      lines.push(
        `- ${trade.ticker} ${trade.trade_type} on ${trade.trade_date} | ${trade.excess_return?.toFixed(2)}% vs SPY | ${trade.amount_range ?? "amount undisclosed"}`
      );
    }
  }

  return lines.join("\n");
}
