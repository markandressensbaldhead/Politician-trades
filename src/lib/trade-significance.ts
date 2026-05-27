import { UnifiedCongressTrade } from "@/types";
import {
  committeeOverlapsSector,
  getDisclosureLagDays,
} from "@/lib/trade-analytics";

export type SignificanceTier = "high" | "medium" | "low";

export type SignificanceFactorId =
  | "size"
  | "recency"
  | "returns"
  | "disclosure"
  | "cluster"
  | "conviction"
  | "trackrecord"
  | "committee";

export interface SignificanceFactor {
  id: SignificanceFactorId;
  label: string;
  points: number;
  maxPoints: number;
}

export interface PoliticianScoreContext {
  returnVsSpy?: number;
  committee?: string;
}

export interface ScoredTrade extends UnifiedCongressTrade {
  significanceScore: number;
  significanceTier: SignificanceTier;
  significanceReasons: string[];
  headline: string;
  investorTake: string;
  signalTag: string;
  signalFactors: SignificanceFactor[];
  clusterPoliticianCount: number;
  clusterNetFlow: "buying" | "selling" | "mixed" | null;
  disclosureLag: number | null;
  amountTier: "mega" | "large" | "medium" | "small" | "unknown";
  politicianReturnVsSpy: number | null;
  hasCommitteeOverlap: boolean;
}

export interface ScoreTradeContext {
  clusterPoliticianCount?: number;
  clusterTradeCount?: number;
  clusterNetFlow?: "buying" | "selling" | "mixed";
  clusterMemberNames?: string[];
  politicianReturnVsSpy?: number;
  politicianCommittee?: string;
}

export interface HighConvictionSummary {
  total: number;
  highCount: number;
  mediumCount: number;
  avgScore: number;
  purchaseCount: number;
  saleCount: number;
  topScore: number;
  avgReturn: number | null;
}

const FACTOR_MAX: Record<SignificanceFactorId, number> = {
  size: 30,
  recency: 20,
  returns: 25,
  disclosure: 10,
  cluster: 15,
  conviction: 4,
  trackrecord: 12,
  committee: 10,
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

function getTraderTrackRecordWeight(returnVsSpy: number | undefined): number {
  if (returnVsSpy == null || !Number.isFinite(returnVsSpy)) return 0;
  if (returnVsSpy >= 12) return 12;
  if (returnVsSpy >= 8) return 8;
  if (returnVsSpy >= 5) return 5;
  return 0;
}

function getCommitteeOverlapWeight(
  committee: string | undefined,
  sector: string
): number {
  return committeeOverlapsSector(committee, sector) ? 10 : 0;
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
  clusterNetFlow: ScoredTrade["clusterNetFlow"];
  excessReturn: number | null;
  disclosureLag: number | null;
  hasCommitteeOverlap: boolean;
}): string {
  const lastName = input.politicianName.split(" ").pop() ?? input.politicianName;

  if (
    input.clusterPoliticianCount >= 3 &&
    input.clusterNetFlow === "buying" &&
    input.type === "Purchase"
  ) {
    return `${input.clusterPoliticianCount} lawmakers buying ${input.ticker} — convergence signal`;
  }

  if (input.hasCommitteeOverlap && input.type === "Purchase") {
    return `${lastName} bought ${input.ticker} in a sector their committee oversees`;
  }

  if (
    input.clusterPoliticianCount >= 3 &&
    input.excessReturn != null &&
    input.excessReturn >= 8
  ) {
    return `${input.ticker} cluster +${Math.abs(input.excessReturn).toFixed(0)}% vs S&P since filings`;
  }

  if (input.clusterPoliticianCount >= 2) {
    return `${input.ticker}: ${input.clusterPoliticianCount} members active — ${lastName} ${input.type === "Purchase" ? "buying" : "selling"}`;
  }

  if (input.excessReturn != null && Math.abs(input.excessReturn) >= 15) {
    return `${input.ticker} ${input.excessReturn >= 0 ? "outperforming" : "lagging"} S&P by ${Math.abs(input.excessReturn).toFixed(0)}% since ${lastName}'s trade`;
  }

  if (input.disclosureLag != null && input.disclosureLag > 45) {
    return `Late ${input.ticker} disclosure from ${lastName} (${input.disclosureLag}-day lag)`;
  }

  if (input.amountTier === "mega" || input.amountTier === "large") {
    return `${lastName}: ${input.amountTier === "mega" ? "multi-million" : "six-figure+"} ${input.ticker} ${input.type.toLowerCase()}`;
  }

  return `${lastName} ${input.type.toLowerCase()} in ${input.ticker}`;
}

function buildInvestorTake(input: {
  politicianName: string;
  ticker: string;
  type: UnifiedCongressTrade["type"];
  amount: string;
  sector: string;
  significanceScore: number;
  clusterPoliticianCount: number;
  clusterNetFlow: ScoredTrade["clusterNetFlow"];
  clusterMemberNames: string[];
  excessReturn: number | null;
  politicianReturnVsSpy: number | null;
  hasCommitteeOverlap: boolean;
  politicianCommittee?: string;
  amountTier: ScoredTrade["amountTier"];
}): string {
  const lastName = input.politicianName.split(" ").pop() ?? input.politicianName;
  const others = input.clusterMemberNames
    .filter((name) => name !== input.politicianName)
    .slice(0, 2)
    .map((name) => name.split(" ").pop())
    .filter(Boolean);

  if (input.clusterPoliticianCount >= 3 && input.clusterNetFlow === "buying") {
    const also =
      others.length > 0 ? ` (${others.join(", ")} also bought recently)` : "";
    return `Multiple lawmakers are net buying ${input.ticker}${also}. Overlapping disclosures are one of the strongest crowd signals on congressional trackers.`;
  }

  if (input.hasCommitteeOverlap && input.politicianCommittee) {
    return `${lastName} serves on ${input.politicianCommittee} and added ${input.sector || "sector"} exposure via ${input.ticker}. Flag for potential committee–sector overlap.`;
  }

  if (
    input.politicianReturnVsSpy != null &&
    input.politicianReturnVsSpy >= 8 &&
    input.type === "Purchase"
  ) {
    return `${lastName}'s recent trades beat the S&P by ${input.politicianReturnVsSpy.toFixed(1)}% on average. This ${input.amount} ${input.ticker} buy fits that track record.`;
  }

  if (input.excessReturn != null && input.excessReturn >= 10) {
    return `${input.ticker} is already ${input.excessReturn >= 0 ? "beating" : "trailing"} the benchmark by ${Math.abs(input.excessReturn).toFixed(1)}% since this filing — the move looks ${input.excessReturn >= 0 ? "well-timed" : "risky in hindsight"}.`;
  }

  if (input.amountTier === "mega") {
    return `Among the largest disclosures in the current window. Whale-sized congressional trades tend to draw the most copycat attention from retail followers.`;
  }

  if (input.clusterPoliticianCount >= 2) {
    return `${input.clusterPoliticianCount} members touched ${input.ticker} recently. Watch for follow-on filings that confirm whether this is a one-off or a theme.`;
  }

  return `Scored ${input.significanceScore}/100 on size, timing, trader track record, and overlap with other Capitol activity in ${input.ticker}.`;
}

function buildSignalTag(input: {
  clusterPoliticianCount: number;
  clusterNetFlow: ScoredTrade["clusterNetFlow"];
  amountTier: ScoredTrade["amountTier"];
  excessReturn: number | null;
  hasCommitteeOverlap: boolean;
  politicianReturnVsSpy: number | null;
  recencyWeight: number;
  type: UnifiedCongressTrade["type"];
}): string {
  if (input.clusterPoliticianCount >= 3 && input.clusterNetFlow === "buying") {
    return "Congress cluster";
  }
  if (input.amountTier === "mega") return "Whale disclosure";
  if (input.hasCommitteeOverlap) return "Committee overlap";
  if (input.excessReturn != null && input.excessReturn >= 10) return "Beating market";
  if (input.politicianReturnVsSpy != null && input.politicianReturnVsSpy >= 8) {
    return "Top trader";
  }
  if (input.recencyWeight >= 12) return "Fresh filing";
  if (input.amountTier === "large") return "Large size";
  if (input.clusterPoliticianCount >= 2) return "Multi-member";
  return input.type === "Purchase" ? "Conviction buy" : "Notable sale";
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

function mergeContext(
  trade: UnifiedCongressTrade,
  clusterIndex?: Map<string, ScoreTradeContext>,
  politicianIndex?: Map<string, PoliticianScoreContext>
): ScoreTradeContext {
  const cluster = clusterIndex?.get(trade.ticker.toUpperCase());
  const politician = politicianIndex?.get(trade.politicianId);

  return {
    ...cluster,
    politicianReturnVsSpy: politician?.returnVsSpy,
    politicianCommittee: politician?.committee,
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
  const clusterNetFlow = context?.clusterNetFlow ?? null;
  const clusterMemberNames = context?.clusterMemberNames ?? [];
  const politicianReturnVsSpy = context?.politicianReturnVsSpy ?? null;
  const politicianCommittee = context?.politicianCommittee;
  const disclosureLag =
    trade.disclosureLagDays ??
    getDisclosureLagDays(trade.tradeDate, trade.filingDate);
  const amountTier = getAmountTier(trade.amount);
  const hasCommitteeOverlap = committeeOverlapsSector(
    politicianCommittee,
    trade.sector
  );

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

  const trackRecordWeight = getTraderTrackRecordWeight(
    politicianReturnVsSpy ?? undefined
  );
  if (trackRecordWeight >= 8) {
    reasons.push("Historically strong trader");
  }
  score += trackRecordWeight;
  const trackRecordFactor = buildFactor(
    "trackrecord",
    "Track record",
    trackRecordWeight
  );
  if (trackRecordFactor) factors.push(trackRecordFactor);

  const committeeWeight = getCommitteeOverlapWeight(
    politicianCommittee,
    trade.sector
  );
  if (committeeWeight > 0) {
    reasons.push("Committee-sector overlap");
  }
  score += committeeWeight;
  const committeeFactor = buildFactor("committee", "Committee", committeeWeight);
  if (committeeFactor) factors.push(committeeFactor);

  if (trade.type === "Purchase" && sizeWeight >= 14) {
    const convictionWeight = 4;
    score += convictionWeight;
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
    clusterNetFlow,
    excessReturn: trade.excessReturn,
    disclosureLag,
    hasCommitteeOverlap,
  });

  const investorTake = buildInvestorTake({
    politicianName: trade.politicianName,
    ticker: trade.ticker,
    type: trade.type,
    amount: trade.amount,
    sector: trade.sector,
    significanceScore: score,
    clusterPoliticianCount,
    clusterNetFlow,
    clusterMemberNames,
    excessReturn: trade.excessReturn,
    politicianReturnVsSpy,
    hasCommitteeOverlap,
    politicianCommittee,
    amountTier,
  });

  const signalTag = buildSignalTag({
    clusterPoliticianCount,
    clusterNetFlow,
    amountTier,
    excessReturn: trade.excessReturn,
    hasCommitteeOverlap,
    politicianReturnVsSpy,
    recencyWeight,
    type: trade.type,
  });

  return {
    ...trade,
    significanceScore: score,
    significanceTier: getTier(score),
    significanceReasons: reasons.slice(0, 3),
    headline,
    investorTake,
    signalTag,
    signalFactors: factors.sort((a, b) => b.points - a.points),
    clusterPoliticianCount,
    clusterNetFlow,
    disclosureLag,
    amountTier,
    politicianReturnVsSpy,
    hasCommitteeOverlap,
  };
}

export function scoreTrades(
  trades: UnifiedCongressTrade[],
  clusterIndex?: Map<string, ScoreTradeContext>,
  politicianIndex?: Map<string, PoliticianScoreContext>
): ScoredTrade[] {
  return trades
    .map((trade) =>
      scoreTrade(
        trade,
        mergeContext(trade, clusterIndex, politicianIndex)
      )
    )
    .sort(
      (a, b) =>
        b.significanceScore - a.significanceScore ||
        new Date(b.filingDate ?? b.tradeDate).getTime() -
          new Date(a.filingDate ?? a.tradeDate).getTime()
    );
}

function diversifyTrades(trades: ScoredTrade[], limit: number): ScoredTrade[] {
  const picked: ScoredTrade[] = [];
  const seenTickers = new Set<string>();

  for (const trade of trades) {
    const ticker = trade.ticker.toUpperCase();
    if (seenTickers.has(ticker)) continue;
    picked.push(trade);
    seenTickers.add(ticker);
    if (picked.length >= limit) return picked;
  }

  for (const trade of trades) {
    if (picked.length >= limit) break;
    if (!picked.some((entry) => entry.id === trade.id)) {
      picked.push(trade);
    }
  }

  return picked;
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
      topScore: 0,
      avgReturn: null,
    };
  }

  const highCount = trades.filter((trade) => trade.significanceTier === "high").length;
  const mediumCount = trades.filter(
    (trade) => trade.significanceTier === "medium"
  ).length;
  const returns = trades
    .map((trade) => trade.excessReturn)
    .filter((value): value is number => value != null && Number.isFinite(value));

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
    topScore: trades[0]?.significanceScore ?? 0,
    avgReturn:
      returns.length > 0
        ? returns.reduce((sum, value) => sum + value, 0) / returns.length
        : null,
  };
}

export function getHighConvictionTrades(
  trades: UnifiedCongressTrade[],
  limit = 8,
  clusterIndex?: Map<string, ScoreTradeContext>,
  options: {
    days?: number;
    minScore?: number;
    politicianIndex?: Map<string, PoliticianScoreContext>;
    diversify?: boolean;
  } = {}
): ScoredTrade[] {
  const days = options.days ?? 90;
  const minScore = options.minScore ?? 30;
  const diversify = options.diversify ?? true;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const ranked = scoreTrades(
    trades.filter(
      (trade) => new Date(trade.tradeDate).getTime() >= cutoff
    ),
    clusterIndex,
    options.politicianIndex
  ).filter((trade) => trade.significanceScore >= minScore);

  return diversify ? diversifyTrades(ranked, limit) : ranked.slice(0, limit);
}

export function buildPoliticianScoreIndex(
  politicians: Array<{
    id: string;
    returnVsSpy: number;
    committee?: string;
  }>
): Map<string, PoliticianScoreContext> {
  return new Map(
    politicians.map((politician) => [
      politician.id,
      {
        returnVsSpy: politician.returnVsSpy,
        committee: politician.committee,
      },
    ])
  );
}
