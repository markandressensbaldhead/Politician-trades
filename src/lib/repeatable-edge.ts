import { UnifiedCongressTrade } from "@/types";
import { averageExcessReturn, computeWinRate } from "@/lib/quiver-mappers";

export type EdgeTier = "proven" | "promising" | "inconsistent" | "cosplay" | "insufficient";

export interface RepeatableEdgeStats {
  edgeScore: number;
  edgeTier: EdgeTier;
  winRate: number;
  avgExcessReturn: number;
  medianExcessReturn: number;
  sampleSize: number;
  scoredTrades: number;
  confidence: number;
  outlierGap: number;
  edgeLabel: string;
  actionHint: string;
  isCosplay: boolean;
}

const FULL_SAMPLE_TRADES = 10;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function sampleConfidence(scoredTrades: number): number {
  if (scoredTrades <= 0) return 0;
  return Math.min(1, Math.log1p(scoredTrades) / Math.log1p(FULL_SAMPLE_TRADES));
}

function classifyEdgeTier(input: {
  scoredTrades: number;
  winRate: number;
  avgExcessReturn: number;
  outlierGap: number;
}): EdgeTier {
  const { scoredTrades, winRate, avgExcessReturn, outlierGap } = input;

  if (scoredTrades < 2) return "insufficient";

  const luckyOutlier =
    scoredTrades < 4 && avgExcessReturn >= 12 && outlierGap >= 10;
  const headlineWithoutHits =
    winRate < 40 && avgExcessReturn >= 8 && outlierGap >= 8;
  const thinSampleHype = scoredTrades < 3 && avgExcessReturn >= 15;

  if (luckyOutlier || headlineWithoutHits || thinSampleHype) {
    return "cosplay";
  }

  if (
    scoredTrades >= 5 &&
    winRate >= 55 &&
    avgExcessReturn >= 3 &&
    outlierGap <= 10
  ) {
    return "proven";
  }

  if (scoredTrades >= 3 && winRate >= 50 && avgExcessReturn >= 2) {
    return "promising";
  }

  if (scoredTrades >= 2) {
    return "inconsistent";
  }

  return "insufficient";
}

function buildEdgeLabel(tier: EdgeTier, winRate: number, scoredTrades: number): string {
  switch (tier) {
    case "proven":
      return `Repeatable edge · ${Math.round(winRate)}% hit rate (${scoredTrades} trades)`;
    case "promising":
      return `Building edge · ${Math.round(winRate)}% hit rate`;
    case "inconsistent":
      return "Mixed track record";
    case "cosplay":
      return "Likely one-off optics";
    default:
      return "Not enough history";
  }
}

function buildActionHint(tier: EdgeTier): string {
  switch (tier) {
    case "proven":
      return "Copy-study candidate — this name has a repeatable beat rate with enough sample size to trust the next buy more than a headline.";
    case "promising":
      return "Early edge signal — worth tracking, but wait for 1–2 more filings before sizing up on this politician alone.";
    case "inconsistent":
      return "Trader history is noisy — lean on crowd overlap and trade size more than this member's name.";
    case "cosplay":
      return "Treat as legalized insider cosplay until the crowd confirms — one lucky filing is not an edge.";
    default:
      return "Sample too thin to rank — use cluster and size signals instead of this politician's track record.";
  }
}

function computeEdgeScore(input: {
  winRate: number;
  avgExcessReturn: number;
  medianExcessReturn: number;
  confidence: number;
  outlierGap: number;
  tier: EdgeTier;
}): number {
  const consistency = 1 - Math.min(1, Math.max(0, input.outlierGap / 18));
  const winComponent = (input.winRate / 100) * 35;
  const returnComponent = Math.min(25, Math.max(0, input.avgExcessReturn) * 2);
  const consistencyComponent = consistency * 20;
  const confidenceComponent = input.confidence * 20;

  let score =
    winComponent + returnComponent + consistencyComponent + confidenceComponent;

  if (input.tier === "cosplay") score -= 28;
  if (input.tier === "insufficient") score -= 12;
  if (input.tier === "proven") score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeRepeatableEdge(
  trades: UnifiedCongressTrade[],
  windowDays = 180
): RepeatableEdgeStats {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recent = trades.filter(
    (trade) => new Date(trade.tradeDate).getTime() >= cutoff
  );

  const returns = recent
    .map((trade) => trade.excessReturn)
    .filter((value): value is number => value != null && Number.isFinite(value));

  const sampleSize = recent.length;
  const scoredTrades = returns.length;
  const winRate = computeWinRate(returns);
  const avgExcessReturn = averageExcessReturn(returns);
  const medianExcessReturn = median(returns);
  const outlierGap = Math.abs(avgExcessReturn - medianExcessReturn);
  const confidence = sampleConfidence(scoredTrades);

  const edgeTier = classifyEdgeTier({
    scoredTrades,
    winRate,
    avgExcessReturn,
    outlierGap,
  });

  const edgeScore = computeEdgeScore({
    winRate,
    avgExcessReturn,
    medianExcessReturn,
    confidence,
    outlierGap,
    tier: edgeTier,
  });

  return {
    edgeScore,
    edgeTier,
    winRate,
    avgExcessReturn,
    medianExcessReturn,
    sampleSize,
    scoredTrades,
    confidence,
    outlierGap,
    edgeLabel: buildEdgeLabel(edgeTier, winRate, scoredTrades),
    actionHint: buildActionHint(edgeTier),
    isCosplay: edgeTier === "cosplay",
  };
}

export function buildPoliticianEdgeIndex(
  trades: UnifiedCongressTrade[],
  windowDays = 180
): Map<string, RepeatableEdgeStats> {
  const grouped = new Map<string, UnifiedCongressTrade[]>();

  for (const trade of trades) {
    const bucket = grouped.get(trade.politicianId) ?? [];
    bucket.push(trade);
    grouped.set(trade.politicianId, bucket);
  }

  const index = new Map<string, RepeatableEdgeStats>();

  for (const [politicianId, politicianTrades] of grouped) {
    index.set(politicianId, computeRepeatableEdge(politicianTrades, windowDays));
  }

  return index;
}

export function getEdgeSortBoost(tier: EdgeTier | undefined): number {
  switch (tier) {
    case "proven":
      return 18;
    case "promising":
      return 8;
    case "inconsistent":
      return -4;
    case "cosplay":
      return -22;
    default:
      return -8;
  }
}

export function getEdgeFactorWeight(edgeScore: number | undefined): number {
  if (edgeScore == null || !Number.isFinite(edgeScore)) return 0;
  if (edgeScore >= 75) return 15;
  if (edgeScore >= 60) return 11;
  if (edgeScore >= 45) return 7;
  if (edgeScore >= 30) return 3;
  return 0;
}

export function getCosplayPenalty(tier: EdgeTier | undefined): number {
  if (tier === "cosplay") return 12;
  if (tier === "insufficient") return 4;
  return 0;
}
