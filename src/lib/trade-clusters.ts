import { UnifiedCongressTrade } from "@/types";
import { ScoreTradeContext } from "@/lib/trade-significance";

export interface TradeCluster {
  ticker: string;
  politicianCount: number;
  tradeCount: number;
  purchaseCount: number;
  saleCount: number;
  politicians: string[];
  lastTradeDate: string;
  netFlow: "buying" | "selling" | "mixed";
}

export function getTradeClusters(
  trades: UnifiedCongressTrade[],
  options: { days?: number; minPoliticians?: number; limit?: number } = {}
): TradeCluster[] {
  const days = options.days ?? 30;
  const minPoliticians = options.minPoliticians ?? 2;
  const limit = options.limit ?? 6;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const recent = trades.filter(
    (trade) => new Date(trade.tradeDate).getTime() >= cutoff
  );

  const byTicker = new Map<
    string,
    {
      politicians: Set<string>;
      politicianNames: Set<string>;
      purchases: number;
      sales: number;
      lastTradeDate: string;
    }
  >();

  for (const trade of recent) {
    const ticker = trade.ticker.toUpperCase();
    const bucket = byTicker.get(ticker) ?? {
      politicians: new Set<string>(),
      politicianNames: new Set<string>(),
      purchases: 0,
      sales: 0,
      lastTradeDate: trade.tradeDate,
    };

    bucket.politicians.add(trade.politicianId);
    bucket.politicianNames.add(trade.politicianName);

    if (trade.type === "Purchase") bucket.purchases += 1;
    else bucket.sales += 1;

    if (new Date(trade.tradeDate) > new Date(bucket.lastTradeDate)) {
      bucket.lastTradeDate = trade.tradeDate;
    }

    byTicker.set(ticker, bucket);
  }

  return [...byTicker.entries()]
    .map(([ticker, stats]) => {
      const tradeCount = stats.purchases + stats.sales;
      const netFlow =
        stats.purchases > stats.sales * 1.5
          ? "buying"
          : stats.sales > stats.purchases * 1.5
            ? "selling"
            : "mixed";

      return {
        ticker,
        politicianCount: stats.politicians.size,
        tradeCount,
        purchaseCount: stats.purchases,
        saleCount: stats.sales,
        politicians: [...stats.politicianNames].slice(0, 5),
        lastTradeDate: stats.lastTradeDate,
        netFlow,
      } satisfies TradeCluster;
    })
    .filter((cluster) => cluster.politicianCount >= minPoliticians)
    .sort(
      (a, b) =>
        b.politicianCount - a.politicianCount ||
        b.tradeCount - a.tradeCount
    )
    .slice(0, limit);
}

export function buildClusterIndex(
  clusters: TradeCluster[]
): Map<string, ScoreTradeContext> {
  const index = new Map<string, ScoreTradeContext>();

  for (const cluster of clusters) {
    index.set(cluster.ticker, {
      clusterPoliticianCount: cluster.politicianCount,
      clusterTradeCount: cluster.tradeCount,
    });
  }

  return index;
}
