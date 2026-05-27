import { UnifiedCongressTrade } from "@/types";
import { getDisclosureLagDays } from "@/lib/trade-analytics";

export type SignificanceTier = "high" | "medium" | "low";

export interface ScoredTrade extends UnifiedCongressTrade {
  significanceScore: number;
  significanceTier: SignificanceTier;
  significanceReasons: string[];
}

export interface ScoreTradeContext {
  clusterPoliticianCount?: number;
  clusterTradeCount?: number;
}

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
    values.length >= 2
      ? (values[0] + values[1]) / 2
      : values[0];

  if (midpoint >= 1_000_000) return 30;
  if (midpoint >= 250_000) return 22;
  if (midpoint >= 50_000) return 14;
  if (midpoint >= 15_000) return 8;
  return 4;
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

export function scoreTrade(
  trade: UnifiedCongressTrade,
  context?: ScoreTradeContext
): ScoredTrade {
  const reasons: string[] = [];
  let score = 0;

  const sizeWeight = parseAmountWeight(trade.amount);
  if (sizeWeight >= 14) {
    reasons.push("Large disclosed size");
  }
  score += sizeWeight;

  const recencyWeight = getRecencyWeight(trade);
  if (recencyWeight >= 12) {
    reasons.push("Recently filed");
  }
  score += recencyWeight;

  const returnWeight = getExcessReturnWeight(trade.excessReturn);
  if (returnWeight >= 12) {
    reasons.push(
      trade.excessReturn != null && trade.excessReturn >= 0
        ? "Strong post-trade return"
        : "Large move since trade"
    );
  }
  score += returnWeight;

  const disclosureWeight = getDisclosureWeight(trade);
  const lag =
    trade.disclosureLagDays ??
    getDisclosureLagDays(trade.tradeDate, trade.filingDate);
  if (lag != null && lag > 45) {
    reasons.push("Late disclosure");
  } else if (disclosureWeight >= 7) {
    reasons.push("Fast disclosure");
  }
  score += disclosureWeight;

  const clusterWeight = getClusterWeight(context);
  if (clusterWeight >= 7) {
    reasons.push("Multiple members trading this name");
  }
  score += clusterWeight;

  if (trade.type === "Purchase" && sizeWeight >= 14) {
    score += 4;
    if (!reasons.includes("Large disclosed size")) {
      reasons.push("Large purchase");
    }
  }

  score = Math.min(100, Math.round(score));

  return {
    ...trade,
    significanceScore: score,
    significanceTier: getTier(score),
    significanceReasons: reasons.slice(0, 3),
  };
}

export function scoreTrades(
  trades: UnifiedCongressTrade[],
  clusterIndex?: Map<string, ScoreTradeContext>
): ScoredTrade[] {
  return trades
    .map((trade) =>
      scoreTrade(
        trade,
        clusterIndex?.get(trade.ticker.toUpperCase())
      )
    )
    .sort(
      (a, b) =>
        b.significanceScore - a.significanceScore ||
        new Date(b.filingDate ?? b.tradeDate).getTime() -
          new Date(a.filingDate ?? a.tradeDate).getTime()
    );
}

export function getHighConvictionTrades(
  trades: UnifiedCongressTrade[],
  limit = 8,
  clusterIndex?: Map<string, ScoreTradeContext>
): ScoredTrade[] {
  return scoreTrades(trades, clusterIndex)
    .filter((trade) => trade.significanceTier !== "low")
    .slice(0, limit);
}
