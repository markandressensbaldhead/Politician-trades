import {
  getCommitteeOverlapFlags,
  getLagSeverity,
  getMarketPulse,
} from "@/lib/trade-analytics";
import { getPoliticianMetadata } from "@/lib/politician-metadata";
import { BRAND } from "@/lib/brand";
import {
  buildClusterIndex,
  getTradeClusters,
  TradeCluster,
} from "@/lib/trade-clusters";
import {
  buildPoliticianScoreIndex,
  scoreTrades,
  ScoredTrade,
} from "@/lib/trade-significance";
import { UnifiedCongressTrade } from "@/types";

export interface TickerMemberSummary {
  politicianId: string;
  politicianName: string;
  party: UnifiedCongressTrade["party"];
  purchaseCount: number;
  saleCount: number;
  lastTradeDate: string;
  avgExcessReturn: number | null;
  committee?: string;
}

export interface TickerIntelligence {
  ticker: string;
  company: string;
  sector: string;
  headline: string;
  investorTake: string;
  purchases: number;
  sales: number;
  politicianCount: number;
  netFlow: "buying" | "selling" | "mixed";
  buyRatio: number;
  avgExcessReturn: number | null;
  medianExcessReturn: number | null;
  winRate: number | null;
  avgDisclosureLag: number | null;
  slowDisclosureCount: number;
  cluster: TradeCluster | null;
  clusterRank: number | null;
  topScoredTrades: ScoredTrade[];
  members: TickerMemberSummary[];
  committeeFlags: ReturnType<typeof getCommitteeOverlapFlags>;
  recent90dCount: number;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function buildMemberSummaries(trades: UnifiedCongressTrade[]): TickerMemberSummary[] {
  const byPolitician = new Map<string, TickerMemberSummary & { returns: number[] }>();

  for (const trade of trades) {
    const meta = getPoliticianMetadata(trade.politicianId);
    const existing = byPolitician.get(trade.politicianId) ?? {
      politicianId: trade.politicianId,
      politicianName: trade.politicianName,
      party: trade.party,
      purchaseCount: 0,
      saleCount: 0,
      lastTradeDate: trade.tradeDate,
      avgExcessReturn: null,
      committee: meta?.committee,
      returns: [],
    };

    if (trade.type === "Purchase") existing.purchaseCount += 1;
    else existing.saleCount += 1;

    if (trade.tradeDate > existing.lastTradeDate) {
      existing.lastTradeDate = trade.tradeDate;
    }

    if (trade.excessReturn != null && Number.isFinite(trade.excessReturn)) {
      existing.returns.push(trade.excessReturn);
    }

    byPolitician.set(trade.politicianId, existing);
  }

  return [...byPolitician.values()]
    .map(({ returns, ...member }) => ({
      ...member,
      avgExcessReturn: average(returns),
    }))
    .sort((a, b) => b.purchaseCount + b.saleCount - (a.purchaseCount + a.saleCount));
}

function buildHeadline(input: {
  ticker: string;
  politicianCount: number;
  netFlow: TickerIntelligence["netFlow"];
  cluster: TradeCluster | null;
  avgExcessReturn: number | null;
}): string {
  if (input.cluster && input.cluster.politicianCount >= 2) {
    return `${input.cluster.politicianCount} lawmakers · ${input.netFlow} $${input.ticker}`;
  }

  if (input.avgExcessReturn != null && input.avgExcessReturn >= 8) {
    return `$${input.ticker} congressional trades averaging +${input.avgExcessReturn.toFixed(0)}% vs S&P`;
  }

  if (input.netFlow === "buying") {
    return `$${input.ticker}: ${BRAND.hill} net buying (${input.politicianCount} members)`;
  }

  if (input.netFlow === "selling") {
    return `$${input.ticker}: ${BRAND.hill} net selling (${input.politicianCount} members)`;
  }

  return `$${input.ticker}: ${input.politicianCount} member${input.politicianCount !== 1 ? "s" : ""} · mixed flow`;
}

function buildInvestorTake(input: {
  ticker: string;
  netFlow: TickerIntelligence["netFlow"];
  cluster: TradeCluster | null;
  avgExcessReturn: number | null;
  slowDisclosureCount: number;
  committeeFlags: TickerIntelligence["committeeFlags"];
  winRate: number | null;
}): string {
  const parts: string[] = [];

  if (input.cluster && input.cluster.politicianCount >= 2) {
    parts.push(
      `Crowd signal: ${input.cluster.politicianCount} members with ${input.cluster.netFlow} pressure. ${input.cluster.headline}`
    );
  }

  if (input.avgExcessReturn != null) {
    parts.push(
      `Since filing, disclosed ${input.ticker} trades have averaged ${input.avgExcessReturn >= 0 ? "+" : ""}${input.avgExcessReturn.toFixed(1)}% vs the S&P 500${
        input.winRate != null ? ` (${Math.round(input.winRate * 100)}% beat the index)` : ""
      }.`
    );
  } else {
    parts.push(
      `Track post-filing performance as returns sync — sizing and timing still tell a story even before vs-S&P data lands.`
    );
  }

  if (input.slowDisclosureCount > 0) {
    parts.push(
      `${input.slowDisclosureCount} trade${input.slowDisclosureCount !== 1 ? "s" : ""} took 45+ days to disclose — factor lag into your entry timing.`
    );
  }

  if (input.committeeFlags.length > 0) {
    parts.push(input.committeeFlags[0].message);
  }

  return parts.join(" ");
}

export function buildTickerIntelligence(
  ticker: string,
  trades: UnifiedCongressTrade[],
  allTrades: UnifiedCongressTrade[] = trades
): TickerIntelligence | null {
  const symbol = ticker.toUpperCase();
  const filtered = trades.filter((trade) => trade.ticker === symbol);

  if (filtered.length === 0) {
    return null;
  }

  const purchases = filtered.filter((trade) => trade.type === "Purchase").length;
  const sales = filtered.length - purchases;
  const buyRatio = purchases / Math.max(filtered.length, 1);
  const netFlow: TickerIntelligence["netFlow"] =
    purchases > sales * 1.25
      ? "buying"
      : sales > purchases * 1.25
        ? "selling"
        : "mixed";

  const returns = filtered
    .map((trade) => trade.excessReturn)
    .filter((value): value is number => value != null && Number.isFinite(value));

  const pulse = getMarketPulse(filtered);
  const slowDisclosureCount = filtered.filter(
    (trade) => getLagSeverity(trade.disclosureLagDays) === "slow"
  ).length;

  const cutoff90 = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent90dCount = filtered.filter(
    (trade) => new Date(trade.tradeDate).getTime() >= cutoff90
  ).length;

  const clusters = getTradeClusters(allTrades, {
    days: 90,
    minPoliticians: 2,
    limit: 20,
  });
  const cluster =
    clusters.find((entry) => entry.ticker.toUpperCase() === symbol) ?? null;
  const clusterRank =
    cluster != null
      ? clusters.findIndex((entry) => entry.ticker.toUpperCase() === symbol) + 1
      : null;

  const politicianIndex = buildPoliticianScoreIndex(
    [...new Set(filtered.map((trade) => trade.politicianId))].map((id) => {
      const meta = getPoliticianMetadata(id);
      return {
        id,
        returnVsSpy: meta?.returnVsSpy ?? 0,
        committee: meta?.committee,
      };
    })
  );
  const clusterIndex = buildClusterIndex(clusters);
  const topScoredTrades = scoreTrades(filtered, clusterIndex, politicianIndex)
    .filter((trade) => trade.significanceScore >= 25)
    .slice(0, 5);

  const members = buildMemberSummaries(filtered);
  const committeeFlags = members.flatMap((member) => {
    const memberTrades = filtered.filter(
      (trade) => trade.politicianId === member.politicianId
    );
    return getCommitteeOverlapFlags({
      trades: memberTrades,
      committee: member.committee,
    });
  });

  const avgExcessReturn = average(returns);
  const winRate =
    returns.length > 0
      ? returns.filter((value) => value > 0).length / returns.length
      : null;

  const first = filtered[0];

  return {
    ticker: symbol,
    company: first.company,
    sector: first.sector || "Unknown",
    purchases,
    sales,
    politicianCount: new Set(filtered.map((trade) => trade.politicianId)).size,
    netFlow,
    buyRatio,
    avgExcessReturn,
    medianExcessReturn: median(returns),
    winRate,
    avgDisclosureLag: pulse.avgDisclosureLagDays,
    slowDisclosureCount,
    cluster,
    clusterRank,
    topScoredTrades,
    members,
    committeeFlags: committeeFlags.slice(0, 3),
    recent90dCount,
    headline: buildHeadline({
      ticker: symbol,
      politicianCount: new Set(filtered.map((trade) => trade.politicianId)).size,
      netFlow,
      cluster,
      avgExcessReturn,
    }),
    investorTake: buildInvestorTake({
      ticker: symbol,
      netFlow,
      cluster,
      avgExcessReturn,
      slowDisclosureCount,
      committeeFlags,
      winRate,
    }),
  };
}
