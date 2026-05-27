import { TradeCluster } from "@/lib/trade-clusters";
import {
  PoliticianScoreContext,
  ScoreTradeContext,
  ScoredTrade,
  scoreTrades,
} from "@/lib/trade-significance";

export type TradeOfTheDayAction = "research-buy" | "review-sell" | "watch";

export interface TradeOfTheDay {
  trade: ScoredTrade;
  pickDate: string;
  action: TradeOfTheDayAction;
  actionLabel: string;
  actionHeadline: string;
  actionSummary: string;
  cluster: TradeCluster | null;
}

function getUtcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getDailyIndex(length: number, date = new Date()): number {
  if (length <= 0) return 0;

  const key = getUtcDateKey(date);
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return hash % length;
}

function buildActionCopy(
  trade: ScoredTrade,
  cluster: TradeCluster | null
): Pick<
  TradeOfTheDay,
  "action" | "actionLabel" | "actionHeadline" | "actionSummary"
> {
  const isPurchase = trade.type === "Purchase";
  const clusterBuying =
    cluster?.netFlow === "buying" || trade.clusterNetFlow === "buying";
  const clusterSelling =
    cluster?.netFlow === "selling" || trade.clusterNetFlow === "selling";
  const lastName = trade.politicianName.split(" ").pop() ?? trade.politicianName;

  if (isPurchase && trade.clusterPoliticianCount >= 3 && clusterBuying) {
    return {
      action: "research-buy",
      actionLabel: `See all $${trade.ticker} trades`,
      actionHeadline: `${trade.clusterPoliticianCount} lawmakers piled into $${trade.ticker}`,
      actionSummary: `When multiple members of Congress buy the same stock, retail watches. This is today's crowd signal — open the ticker page before it hits your timeline.`,
    };
  }

  if (isPurchase && trade.significanceTier === "high") {
    return {
      action: "research-buy",
      actionLabel: `Research $${trade.ticker}`,
      actionHeadline: `${lastName} dropped a major $${trade.ticker} buy`,
      actionSummary: `High-conviction disclosure with real size. See the filing, the timing, and how it's performed vs the S&P since they traded.`,
    };
  }

  if (isPurchase) {
    return {
      action: "research-buy",
      actionLabel: `Track $${trade.ticker}`,
      actionHeadline: `${lastName} just bought $${trade.ticker}`,
      actionSummary: `Fresh congressional buying in ${trade.sector || "this name"}. One click to every related trade — then set an alert so you don't miss the next filing.`,
    };
  }

  if (!isPurchase && trade.clusterPoliticianCount >= 2 && clusterSelling) {
    return {
      action: "review-sell",
      actionLabel: `Review $${trade.ticker}`,
      actionHeadline: `Capitol is selling $${trade.ticker}`,
      actionSummary: `Multiple lawmakers trimming the same name. If you're holding it, read the filings — don't ignore the signal.`,
    };
  }

  if (!isPurchase) {
    return {
      action: "review-sell",
      actionLabel: `See $${trade.ticker} sales`,
      actionHeadline: `${lastName} sold $${trade.ticker}`,
      actionSummary: `Congressional selling often flags profit-taking or risk reduction. Check whether it overlaps your portfolio.`,
    };
  }

  return {
    action: "watch",
    actionLabel: `Watch ${trade.ticker}`,
    actionHeadline: `${trade.ticker} is today's Capitol signal`,
    actionSummary: trade.investorTake,
  };
}

function buildCandidatePool(scored: ScoredTrade[]): ScoredTrade[] {
  const purchases = scored.filter((trade) => trade.type === "Purchase");
  const ranked = (purchases.length > 0 ? purchases : scored)
    .sort((a, b) => b.significanceScore - a.significanceScore)
    .slice(0, 6);

  return ranked.length > 0 ? ranked : scored.slice(0, 1);
}

export function getTradeOfTheDay(
  trades: Parameters<typeof scoreTrades>[0],
  options: {
    clusterIndex?: Map<string, ScoreTradeContext>;
    politicianIndex?: Map<string, PoliticianScoreContext>;
    clusters?: TradeCluster[];
    days?: number;
    minScore?: number;
    date?: Date;
  } = {}
): TradeOfTheDay | null {
  const days = options.days ?? 45;
  const minScore = options.minScore ?? 40;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const pickDate = getUtcDateKey(options.date);

  const scored = scoreTrades(
    trades.filter((trade) => new Date(trade.tradeDate).getTime() >= cutoff),
    options.clusterIndex,
    options.politicianIndex
  ).filter((trade) => trade.significanceScore >= minScore);

  if (scored.length === 0) {
    return null;
  }

  const pool = buildCandidatePool(scored);
  const trade = pool[getDailyIndex(pool.length, options.date)];
  const cluster =
    options.clusters?.find(
      (entry) => entry.ticker.toUpperCase() === trade.ticker.toUpperCase()
    ) ?? null;

  return {
    trade,
    pickDate,
    cluster,
    ...buildActionCopy(trade, cluster),
  };
}
