import {
  AlphaBriefContent,
  DeploymentDirection,
} from "@/types/alpha-brief";
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
  days = ALPHA_BRIEF_WINDOW_DAYS,
  edgeContext?: {
    edgeScore?: number;
    edgeTier?: string;
    winRate?: number;
    actionHint?: string;
  }
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
  ];

  if (edgeContext?.edgeTier) {
    lines.push(
      "",
      "Repeatable edge profile:",
      `- Tier: ${edgeContext.edgeTier}`,
      edgeContext.edgeScore != null
        ? `- Edge score: ${edgeContext.edgeScore}/100`
        : "- Edge score: unavailable",
      edgeContext.winRate != null
        ? `- Hit rate vs S&P: ${Math.round(edgeContext.winRate)}%`
        : "- Hit rate vs S&P: unavailable",
      edgeContext.actionHint
        ? `- Action framing: ${edgeContext.actionHint}`
        : "- Action framing: use cluster/size if edge is thin"
    );
  }

  lines.push("", "Tickers with activity in window:");

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

function directionForTrade(trade: CongressTradeRow): DeploymentDirection {
  if (trade.trade_type === "Purchase") return "Long";
  if (trade.trade_type === "Sale") return "Short";
  return "Watch";
}

export function buildFallbackAlphaBrief(input: {
  politicianName: string;
  committee?: string;
  trades: CongressTradeRow[];
  windowDays?: number;
}): AlphaBriefContent {
  const windowDays = input.windowDays ?? ALPHA_BRIEF_WINDOW_DAYS;
  const recent = filterTradesInWindow(input.trades, windowDays);
  const source = recent.length > 0 ? recent : input.trades.slice(0, 10);
  const purchases = source.filter((trade) => trade.trade_type === "Purchase");
  const sales = source.filter((trade) => trade.trade_type !== "Purchase");

  const ranked = [...source].sort((a, b) => {
    const aScore = a.excess_return ?? -999;
    const bScore = b.excess_return ?? -999;
    if (bScore !== aScore) return bScore - aScore;
    return b.trade_date.localeCompare(a.trade_date);
  });

  const topSector = [...source.reduce((map, trade) => {
    if (!trade.sector) return map;
    map.set(trade.sector, (map.get(trade.sector) ?? 0) + 1);
    return map;
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1])[0];

  const deploymentIdeas = ranked.slice(0, 4).map((trade) => {
    const direction = directionForTrade(trade);
    const excess =
      trade.excess_return != null
        ? `${trade.excess_return >= 0 ? "+" : ""}${trade.excess_return.toFixed(2)}% vs SPY`
        : "benchmark data unavailable";

    return {
      ticker: trade.ticker.toUpperCase(),
      direction,
      conviction:
        trade.excess_return != null && trade.excess_return > 5
          ? ("High" as const)
          : ("Medium" as const),
      rationale: `${input.politicianName} ${trade.trade_type.toLowerCase()}d ${trade.amount_range ?? "undisclosed amount"} on ${trade.trade_date} (${excess}).`,
      catalyst: input.committee
        ? `${input.committee} committee overlap — verify sector catalyst`
        : "Flow-led",
      sizeHint:
        direction === "Long"
          ? "Starter long aligned to disclosed purchase size"
          : direction === "Short"
            ? "Hedge leg or pair vs sector ETF"
            : "Watchlist until next filing",
    };
  });

  const headline =
    recent.length > 0
      ? `${input.politicianName}'s last ${windowDays} days skew ${purchases.length >= sales.length ? "net buying" : "net selling"} — ${ranked[0]?.ticker ?? "flow"} leads the book`
      : `No filings in the last ${windowDays} days — lean on most recent disclosed activity`;

  return {
    headline,
    thesis:
      recent.length > 0
        ? `Over the last ${windowDays} days, ${input.politicianName} filed ${recent.length} transactions (${purchases.length} purchases, ${sales.length} sales). The highest-signal name is ${ranked[0]?.ticker ?? "unclear"} based on recency and excess return where available.`
        : `${input.politicianName} has not filed new trades inside the ${windowDays}-day window. The ideas below reflect the latest available disclosures — treat timing as stale until a fresh filing lands.`,
    deploymentIdeas,
    sectorTheme: topSector
      ? `${topSector[0]} dominates recent flow (${topSector[1]} trades) — consider a sector ETF expression if single-name risk is too high.`
      : "Sector data is sparse — express the thesis through the individual names below.",
    timingEdge:
      recent.length > 0
        ? "Disclosure dates are within the last month — signal is relatively fresh. Enter in tranches as price confirms the flow direction."
        : "Signal freshness is weak. Scale in only after a new PTR filing or price confirmation.",
    riskManagement:
      "Congressional flow can reverse without warning. Cap single-name exposure, use stops on the underlying, and re-check filings weekly.",
    playbook:
      recent.length > 0
        ? `Deploy capital by mirroring the largest recent purchase tickers with starter positions (25–50 bps of portfolio), add on confirmation, and hedge sector risk with an inverse or paired ETF if the book is one-directional. Monitor ${input.politicianName}'s next filing — that is your exit signal if flow reverses.`
        : `Without fresh 30-day flow, keep powder dry or run a small watchlist position in the most recent buy names only. Wait for the next disclosure before sizing up.`,
  };
}
