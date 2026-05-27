import { UnifiedCongressTrade } from "@/types";
import { getDisclosureLagDays } from "@/lib/trade-analytics";

export type SignificanceTier = "high" | "medium" | "low";

export type SignificanceFactorId =
  | "size"
  | "recency"
  | "returns"
  | "disclosure"
  | "cluster"
  | "conviction";

export interface SignificanceFactor {
  id: SignificanceFactorId;
  label: string;
  points: number;
  maxPoints: number;
}

export interface ScoredTrade extends UnifiedCongressTrade {
  significanceScore: number;
  significanceTier: SignificanceTier;
  significanceReasons: string[];
  headline: string;
  signalFactors: SignificanceFactor[];
  clusterPoliticianCount: number;
  disclosureLag: number | null;
  amountTier: "mega" | "large" | "medium" | "small" | "unknown";
}

export interface ScoreTradeContext {
  clusterPoliticianCount?: number;
  clusterTradeCount?: number;
}

export interface HighConvictionSummary {
  total: number;
  highCount: number;
  mediumCount: number;
  avgScore: number;
  purchaseCount: number;
  saleCount: number;
}

const FACTOR_MAX: Record<SignificanceFactorId, number> = {
  size: 30,
  recency: 20,
  returns: 25,
  disclosure: 10,
  cluster: 15,
  conviction: 4,
};

function parseAmountWeight(amount: string): number {
  const normalized = amount.toLowerCase();

  if (
    normalized.includes("undisclosed") ||
    normalized.includes("unknown") ||
    !normalized.trim()
  ) {
    return 0;
  }

  const values: number[] = [];
  const matches = normalized.matchAll(/([\d.]+)\s*([kmb])?/g);

  for (const match of matches) {
    const base = Number.parseFloat(match[1]);
    if (!Number.isFinite(base)) continue;

    const unit = match[2];
    if (unit === "b") values.push(base * 1_000_000_000);
    else if (unit === "m") values.push(base * 1_000_000);
    else if (unit === "k") values.push(base * 1_000);
    else values.push(base);
  }

  if (values.length === 0) return 0;

  const midpoint =
    values.length >= 2 ? (values[0] + values[1]) / 2 : values[0];

  if (midpoint >= 1_000_000) return FACTOR_MAX.size;
  if (midpoint >= 250_000) return 22;
  if (midpoint >= 50_000) return 14;
  if (midpoint >= 15_000) return 8;
  return 4;
}

function getAmountTier(amount: string): ScoredTrade["amountTier"] {
  const weight = parseAmountWeight(amount);
  if (weight >= 30) return "mega";
  if (weight >= 22) return "large";
  if (weight >= 14) return "medium";
  if (weight >= 8) return "small";
  return "unknown";
}

function getRecencyWeight(trade: UnifiedCongressTrade): number {
  const referenceDate = trade.filingDate ?? trade.tradeDate;
  const filedAt = new Date(referenceDate).getTime();

  if (Number.isNaN(filedAt)) return 0;

  const daysAgo = Math.floor((Date.now() - filedAt) / (24 * 60 * 60 * 1000));

  if (daysAgo <= 3) return 20;
  if (daysAgo <= 7) return 16;
  if (daysAgo <= 14) return 12;
  if (daysAgo <= 30) return 8;
  if (daysAgo <= 60) return 4;
  return 0;
}

function getExcessReturnWeight(excessReturn: number | null): number {
  if (excessReturn == null || !Number.isFinite(excessReturn)) return 0;

  const abs = Math.abs(excessReturn);
  if (abs >= 25) return 25;
  if (abs >= 15) return 18;
  if (abs >= 8) return 12;
  if (abs >= 3) return 6;
  return 0;
}

function getDisclosureWeight(trade: UnifiedCongressTrade): number {
  const lag =
    trade.disclosureLagDays ??
    getDisclosureLagDays(trade.tradeDate, trade.filingDate);

  if (lag == null) return 0;
  if (lag <= 10) return 10;
  if (lag <= 30) return 7;
  if (lag > 45) return 8;
  return 3;
}

function getClusterWeight(context?: ScoreTradeContext): number {
  const politicians = context?.clusterPoliticianCount ?? 0;
  const trades = context?.clusterTradeCount ?? 0;

  if (politicians >= 4 || trades >= 6) return 15;
  if (politicians >= 3 || trades >= 4) return 11;
  if (politicians >= 2) return 7;
  return 0;
}

function getTier(score: number): SignificanceTier {
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function buildHeadline(input: {
  politicianName: string;
  ticker: string;
  type: UnifiedCongressTrade["type"];
  amountTier: ScoredTrade["amountTier"];
  clusterPoliticianCount: number;
  excessReturn: number | null;
  disclosureLag: number | null;
  netFlowLabel?: string;
}): string {
  const lastName = input.politicianName.split(" ").pop() ?? input.politicianName;
  const sizeLabel =
    input.amountTier === "mega"
      ? "Mega-sized"
      : input.amountTier === "large"
        ? "Large"
        : input.amountTier === "medium"
          ? "Notable"
          : "";

  const action =
    input.type === "Purchase"
      ? sizeLabel
        ? `${sizeLabel.toLowerCase()} buy`
        : "purchase"
      : sizeLabel
        ? `${sizeLabel.toLowerCase()} sale`
        : "sale";

  if (
    input.clusterPoliticianCount >= 3 &&
    input.excessReturn != null &&
    input.excessReturn >= 8
  ) {
    return `${lastName}'s ${input.ticker} ${action} — ${input.clusterPoliticianCount} members converged, up ${Math.abs(input.excessReturn).toFixed(0)}% vs S&P`;
  }

  if (input.clusterPoliticianCount >= 2) {
    return `${lastName} ${action} in ${input.ticker} while ${input.clusterPoliticianCount - 1} other member${input.clusterPoliticianCount > 2 ? "s" : ""} traded the same name`;
  }

  if (input.excessReturn != null && Math.abs(input.excessReturn) >= 15) {
    const direction = input.excessReturn >= 0 ? "outperforming" : "underperforming";
    return `${input.ticker} move since filing: ${direction} S&P by ${Math.abs(input.excessReturn).toFixed(0)}% after ${lastName}'s ${input.type.toLowerCase()}`;
  }

  if (input.disclosureLag != null && input.disclosureLag > 45) {
    return `Late-disclosed ${input.ticker} ${input.type.toLowerCase()} from ${lastName} (${input.disclosureLag}d lag)`;
  }

  if (input.amountTier === "mega" || input.amountTier === "large") {
    return `${lastName} disclosed a ${input.amountTier === "mega" ? "multi-million" : "six-figure+"} ${input.ticker} ${input.type.toLowerCase()}`;
  }

  if (input.excessReturn != null && input.excessReturn >= 5) {
    return `Early mover: ${lastName}'s ${input.ticker} ${input.type.toLowerCase()} is already beating the market`;
  }

  return `${lastName} ${action} in ${input.ticker} — ranked above routine disclosure noise`;
}

function buildFactor(
  id: SignificanceFactorId,
  label: string,
  points: number
): SignificanceFactor | null {
  if (points <= 0) return null;

  return {
    id,
    label,
    points,
    maxPoints: FACTOR_MAX[id],
  };
}

export function scoreTrade(
  trade: UnifiedCongressTrade,
  context?: ScoreTradeContext
): ScoredTrade {
  const reasons: string[] = [];
  const factors: SignificanceFactor[] = [];
  let score = 0;

  const clusterPoliticianCount = context?.clusterPoliticianCount ?? 0;
  const disclosureLag =
    trade.disclosureLagDays ??
    getDisclosureLagDays(trade.tradeDate, trade.filingDate);
  const amountTier = getAmountTier(trade.amount);

  const sizeWeight = parseAmountWeight(trade.amount);
  if (sizeWeight >= 14) {
    reasons.push(
      amountTier === "mega" ? "Mega-sized disclosure" : "Large disclosed size"
    );
  }
  score += sizeWeight;
  const sizeFactor = buildFactor(
    "size",
    amountTier === "mega" ? "Mega size" : "Trade size",
    sizeWeight
  );
  if (sizeFactor) factors.push(sizeFactor);

  const recencyWeight = getRecencyWeight(trade);
  if (recencyWeight >= 12) {
    reasons.push("Recently filed");
  }
  score += recencyWeight;
  const recencyFactor = buildFactor("recency", "Recency", recencyWeight);
  if (recencyFactor) factors.push(recencyFactor);

  const returnWeight = getExcessReturnWeight(trade.excessReturn);
  if (returnWeight >= 12) {
    reasons.push(
      trade.excessReturn != null && trade.excessReturn >= 0
        ? "Strong post-trade return"
        : "Large move since trade"
    );
  }
  score += returnWeight;
  const returnFactor = buildFactor("returns", "Vs S&P 500", returnWeight);
  if (returnFactor) factors.push(returnFactor);

  const disclosureWeight = getDisclosureWeight(trade);
  if (disclosureLag != null && disclosureLag > 45) {
    reasons.push("Late disclosure");
  } else if (disclosureWeight >= 7) {
    reasons.push("Fast disclosure");
  }
  score += disclosureWeight;
  const disclosureFactor = buildFactor(
    "disclosure",
    disclosureLag != null && disclosureLag > 45 ? "Late filing" : "Disclosure",
    disclosureWeight
  );
  if (disclosureFactor) factors.push(disclosureFactor);

  const clusterWeight = getClusterWeight(context);
  if (clusterWeight >= 7) {
    reasons.push(
      clusterPoliticianCount >= 3
        ? `${clusterPoliticianCount} members on this name`
        : "Multiple members trading this name"
    );
  }
  score += clusterWeight;
  const clusterFactor = buildFactor("cluster", "Cluster", clusterWeight);
  if (clusterFactor) factors.push(clusterFactor);

  let convictionWeight = 0;
  if (trade.type === "Purchase" && sizeWeight >= 14) {
    convictionWeight = 4;
    score += convictionWeight;
    if (!reasons.some((reason) => reason.includes("size") || reason.includes("Large"))) {
      reasons.push("High-conviction purchase");
    }
    const convictionFactor = buildFactor(
      "conviction",
      "Buy conviction",
      convictionWeight
    );
    if (convictionFactor) factors.push(convictionFactor);
  }

  score = Math.min(100, Math.round(score));

  const headline = buildHeadline({
    politicianName: trade.politicianName,
    ticker: trade.ticker,
    type: trade.type,
    amountTier,
    clusterPoliticianCount,
    excessReturn: trade.excessReturn,
    disclosureLag,
  });

  return {
    ...trade,
    significanceScore: score,
    significanceTier: getTier(score),
    significanceReasons: reasons.slice(0, 4),
    headline,
    signalFactors: factors.sort((a, b) => b.points - a.points),
    clusterPoliticianCount,
    disclosureLag,
    amountTier,
  };
}

export function scoreTrades(
  trades: UnifiedCongressTrade[],
  clusterIndex?: Map<string, ScoreTradeContext>
): ScoredTrade[] {
  return trades
    .map((trade) =>
      scoreTrade(trade, clusterIndex?.get(trade.ticker.toUpperCase()))
    )
    .sort(
      (a, b) =>
        b.significanceScore - a.significanceScore ||
        new Date(b.filingDate ?? b.tradeDate).getTime() -
          new Date(a.filingDate ?? a.tradeDate).getTime()
    );
}

export function summarizeHighConviction(
  trades: ScoredTrade[]
): HighConvictionSummary {
  if (trades.length === 0) {
    return {
      total: 0,
      highCount: 0,
      mediumCount: 0,
      avgScore: 0,
      purchaseCount: 0,
      saleCount: 0,
    };
  }

  const highCount = trades.filter((trade) => trade.significanceTier === "high").length;
  const mediumCount = trades.filter(
    (trade) => trade.significanceTier === "medium"
  ).length;

  return {
    total: trades.length,
    highCount,
    mediumCount,
    avgScore: Math.round(
      trades.reduce((sum, trade) => sum + trade.significanceScore, 0) /
        trades.length
    ),
    purchaseCount: trades.filter((trade) => trade.type === "Purchase").length,
    saleCount: trades.filter((trade) => trade.type === "Sale").length,
  };
}

export function getHighConvictionTrades(
  trades: UnifiedCongressTrade[],
  limit = 8,
  clusterIndex?: Map<string, ScoreTradeContext>,
  options: { days?: number; minScore?: number } = {}
): ScoredTrade[] {
  const days = options.days ?? 90;
  const minScore = options.minScore ?? 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return scoreTrades(
    trades.filter(
      (trade) => new Date(trade.tradeDate).getTime() >= cutoff
    ),
    clusterIndex
  )
    .filter((trade) => trade.significanceScore >= minScore)
    .slice(0, limit);
}
