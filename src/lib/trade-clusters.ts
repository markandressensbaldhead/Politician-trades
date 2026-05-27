import { Party, UnifiedCongressTrade } from "@/types";
import { ScoreTradeContext } from "@/lib/trade-significance";

export type ClusterSignal = "strong" | "notable" | "watch";

export interface ClusterMemberTrade {
  politicianId: string;
  politicianName: string;
  party: Party;
  chamber: string;
  type: "Purchase" | "Sale";
  amount: string;
  tradeDate: string;
}

export interface TradeCluster {
  ticker: string;
  company: string;
  sector: string;
  politicianCount: number;
  tradeCount: number;
  purchaseCount: number;
  saleCount: number;
  democratCount: number;
  republicanCount: number;
  senateCount: number;
  houseCount: number;
  members: ClusterMemberTrade[];
  politicians: string[];
  lastTradeDate: string;
  firstTradeDate: string;
  netFlow: "buying" | "selling" | "mixed";
  buyRatio: number;
  signalScore: number;
  signal: ClusterSignal;
  headline: string;
  isBipartisan: boolean;
  recentBurstCount: number;
  avgExcessReturn: number | null;
}

export interface SectorCluster {
  sector: string;
  politicianCount: number;
  tradeCount: number;
  purchaseCount: number;
  topTickers: string[];
  netFlow: "buying" | "selling" | "mixed";
  headline: string;
}

interface TickerBucket {
  politicians: Map<string, ClusterMemberTrade>;
  trades: ClusterMemberTrade[];
  purchases: number;
  sales: number;
  company: string;
  sector: string;
  excessReturns: number[];
  lastTradeDate: string;
  firstTradeDate: string;
  recentBurstCount: number;
}

function getSignal(score: number): ClusterSignal {
  if (score >= 70) return "strong";
  if (score >= 45) return "notable";
  return "watch";
}

function buildHeadline(input: {
  ticker: string;
  politicianCount: number;
  purchaseCount: number;
  saleCount: number;
  isBipartisan: boolean;
  netFlow: TradeCluster["netFlow"];
  recentBurstCount: number;
  sector: string;
}): string {
  const flow =
    input.netFlow === "buying"
      ? "net buying"
      : input.netFlow === "selling"
        ? "net selling"
        : "mixed activity";

  if (input.isBipartisan && input.politicianCount >= 2) {
    return `${input.politicianCount} members from both parties — ${flow} in ${input.ticker}`;
  }

  if (input.recentBurstCount >= 2) {
    return `${input.recentBurstCount} trades in the last 14 days — unusual ${flow}`;
  }

  if (input.politicianCount >= 3) {
    return `${input.politicianCount} members converged on ${input.ticker} (${flow})`;
  }

  if (input.sector) {
    return `${input.politicianCount} members active in ${input.sector} via ${input.ticker}`;
  }

  return `${input.politicianCount} members traded ${input.ticker} — ${flow}`;
}

function scoreCluster(input: {
  politicianCount: number;
  tradeCount: number;
  isBipartisan: boolean;
  netFlow: TradeCluster["netFlow"];
  recentBurstCount: number;
  avgExcessReturn: number | null;
  lastTradeDate: string;
}): number {
  let score = 0;

  score += Math.min(input.politicianCount * 18, 54);
  score += Math.min(input.tradeCount * 4, 20);

  if (input.isBipartisan) score += 12;
  if (input.netFlow !== "mixed") score += 8;
  if (input.recentBurstCount >= 2) score += 10;
  if (input.recentBurstCount >= 3) score += 5;

  const daysSinceLast = Math.floor(
    (Date.now() - new Date(input.lastTradeDate).getTime()) / (24 * 60 * 60 * 1000)
  );
  if (daysSinceLast <= 14) score += 12;
  else if (daysSinceLast <= 30) score += 8;
  else if (daysSinceLast <= 60) score += 4;

  if (input.avgExcessReturn != null && input.avgExcessReturn >= 5) score += 8;

  return Math.min(100, Math.round(score));
}

export function getTradeClusters(
  trades: UnifiedCongressTrade[],
  options: { days?: number; minPoliticians?: number; limit?: number } = {}
): TradeCluster[] {
  const days = options.days ?? 90;
  const minPoliticians = options.minPoliticians ?? 2;
  const limit = options.limit ?? 8;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const burstCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const recent = trades.filter(
    (trade) => new Date(trade.tradeDate).getTime() >= cutoff
  );

  const byTicker = new Map<string, TickerBucket>();

  for (const trade of recent) {
    const ticker = trade.ticker.toUpperCase();
    const member: ClusterMemberTrade = {
      politicianId: trade.politicianId,
      politicianName: trade.politicianName,
      party: trade.party,
      chamber: trade.chamber,
      type: trade.type,
      amount: trade.amount,
      tradeDate: trade.tradeDate,
    };

    const bucket = byTicker.get(ticker) ?? {
      politicians: new Map<string, ClusterMemberTrade>(),
      trades: [],
      purchases: 0,
      sales: 0,
      company: trade.company,
      sector: trade.sector || "Other",
      excessReturns: [],
      lastTradeDate: trade.tradeDate,
      firstTradeDate: trade.tradeDate,
      recentBurstCount: 0,
    };

    bucket.trades.push(member);

    const existing = bucket.politicians.get(trade.politicianId);
    if (
      !existing ||
      new Date(trade.tradeDate) > new Date(existing.tradeDate)
    ) {
      bucket.politicians.set(trade.politicianId, member);
    }

    if (trade.type === "Purchase") bucket.purchases += 1;
    else bucket.sales += 1;

    if (trade.excessReturn != null && Number.isFinite(trade.excessReturn)) {
      bucket.excessReturns.push(trade.excessReturn);
    }

    if (new Date(trade.tradeDate) > new Date(bucket.lastTradeDate)) {
      bucket.lastTradeDate = trade.tradeDate;
      bucket.company = trade.company || bucket.company;
      bucket.sector = trade.sector || bucket.sector;
    }

    if (new Date(trade.tradeDate) < new Date(bucket.firstTradeDate)) {
      bucket.firstTradeDate = trade.tradeDate;
    }

    if (new Date(trade.tradeDate).getTime() >= burstCutoff) {
      bucket.recentBurstCount += 1;
    }

    byTicker.set(ticker, bucket);
  }

  return [...byTicker.entries()]
    .map(([ticker, stats]) => {
      const members = [...stats.politicians.values()].sort(
        (a, b) =>
          new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
      );
      const tradeCount = stats.trades.length;
      const buyRatio =
        tradeCount > 0 ? stats.purchases / tradeCount : 0;
      const netFlow =
        stats.purchases > stats.sales * 1.5
          ? "buying"
          : stats.sales > stats.purchases * 1.5
            ? "selling"
            : "mixed";

      const democratCount = members.filter(
        (member) => member.party === "Democrat"
      ).length;
      const republicanCount = members.filter(
        (member) => member.party === "Republican"
      ).length;
      const isBipartisan = democratCount > 0 && republicanCount > 0;

      const avgExcessReturn =
        stats.excessReturns.length > 0
          ? stats.excessReturns.reduce((sum, value) => sum + value, 0) /
            stats.excessReturns.length
          : null;

      const signalScore = scoreCluster({
        politicianCount: members.length,
        tradeCount,
        isBipartisan,
        netFlow,
        recentBurstCount: stats.recentBurstCount,
        avgExcessReturn,
        lastTradeDate: stats.lastTradeDate,
      });

      return {
        ticker,
        company: stats.company,
        sector: stats.sector,
        politicianCount: members.length,
        tradeCount,
        purchaseCount: stats.purchases,
        saleCount: stats.sales,
        democratCount,
        republicanCount,
        senateCount: members.filter((member) => member.chamber === "Senate")
          .length,
        houseCount: members.filter((member) => member.chamber === "House")
          .length,
        members,
        politicians: members.map((member) => member.politicianName),
        lastTradeDate: stats.lastTradeDate,
        firstTradeDate: stats.firstTradeDate,
        netFlow,
        buyRatio,
        signalScore,
        signal: getSignal(signalScore),
        isBipartisan,
        recentBurstCount: stats.recentBurstCount,
        avgExcessReturn,
        headline: buildHeadline({
          ticker,
          politicianCount: members.length,
          purchaseCount: stats.purchases,
          saleCount: stats.sales,
          isBipartisan,
          netFlow,
          recentBurstCount: stats.recentBurstCount,
          sector: stats.sector,
        }),
      } satisfies TradeCluster;
    })
    .filter((cluster) => cluster.politicianCount >= minPoliticians)
    .sort(
      (a, b) =>
        b.signalScore - a.signalScore ||
        b.politicianCount - a.politicianCount ||
        b.tradeCount - a.tradeCount
    )
    .slice(0, limit);
}

export function getSectorClusters(
  trades: UnifiedCongressTrade[],
  options: { days?: number; minPoliticians?: number; limit?: number } = {}
): SectorCluster[] {
  const days = options.days ?? 90;
  const minPoliticians = options.minPoliticians ?? 3;
  const limit = options.limit ?? 4;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const buckets = new Map<
    string,
    {
      politicians: Set<string>;
      purchases: number;
      sales: number;
      tickers: Map<string, number>;
    }
  >();

  for (const trade of trades) {
    if (new Date(trade.tradeDate).getTime() < cutoff) continue;

    const sector = trade.sector?.trim() || "Other";
    const bucket = buckets.get(sector) ?? {
      politicians: new Set<string>(),
      purchases: 0,
      sales: 0,
      tickers: new Map<string, number>(),
    };

    bucket.politicians.add(trade.politicianId);
    if (trade.type === "Purchase") bucket.purchases += 1;
    else bucket.sales += 1;
    bucket.tickers.set(
      trade.ticker.toUpperCase(),
      (bucket.tickers.get(trade.ticker.toUpperCase()) ?? 0) + 1
    );

    buckets.set(sector, bucket);
  }

  return [...buckets.entries()]
    .map(([sector, stats]) => {
      const tradeCount = stats.purchases + stats.sales;
      const netFlow =
        stats.purchases > stats.sales * 1.5
          ? "buying"
          : stats.sales > stats.purchases * 1.5
            ? "selling"
            : "mixed";
      const topTickers = [...stats.tickers.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([ticker]) => ticker);

      return {
        sector,
        politicianCount: stats.politicians.size,
        tradeCount,
        purchaseCount: stats.purchases,
        topTickers,
        netFlow,
        headline: `${stats.politicians.size} members active in ${sector} — ${netFlow} across ${topTickers.slice(0, 3).join(", ") || "multiple names"}`,
      } satisfies SectorCluster;
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
