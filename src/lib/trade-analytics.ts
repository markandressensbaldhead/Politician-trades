import { Chamber, Party, UnifiedCongressTrade } from "@/types";

export function getDisclosureLagDays(
  tradeDate: string,
  filingDate: string | null | undefined
): number | null {
  if (!filingDate) {
    return null;
  }

  const trade = new Date(tradeDate);
  const filed = new Date(filingDate);

  if (Number.isNaN(trade.getTime()) || Number.isNaN(filed.getTime())) {
    return null;
  }

  return Math.max(
    0,
    Math.floor((filed.getTime() - trade.getTime()) / (24 * 60 * 60 * 1000))
  );
}

export function getLagSeverity(days: number | null): "fast" | "normal" | "slow" | "unknown" {
  if (days == null) return "unknown";
  if (days <= 30) return "fast";
  if (days <= 45) return "normal";
  return "slow";
}

export function getLagLabel(days: number | null): string {
  if (days == null) return "Filing date unknown";
  if (days === 0) return "Same-day disclosure";
  if (days === 1) return "1 day to disclose";
  return `${days} days to disclose`;
}

export interface TrendingTicker {
  ticker: string;
  tradeCount: number;
  purchaseCount: number;
  saleCount: number;
  politicianCount: number;
  lastTradeDate: string;
  netFlow: "buying" | "selling" | "mixed";
}

export function getTrendingTickers(
  trades: UnifiedCongressTrade[],
  limit = 12,
  days = 90
): TrendingTicker[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = trades.filter(
    (trade) => new Date(trade.tradeDate).getTime() >= cutoff
  );

  const byTicker = new Map<
    string,
    {
      purchases: number;
      sales: number;
      politicians: Set<string>;
      lastTradeDate: string;
    }
  >();

  for (const trade of recent) {
    const ticker = trade.ticker.toUpperCase();
    const bucket = byTicker.get(ticker) ?? {
      purchases: 0,
      sales: 0,
      politicians: new Set<string>(),
      lastTradeDate: trade.tradeDate,
    };

    if (trade.type === "Purchase") {
      bucket.purchases += 1;
    } else {
      bucket.sales += 1;
    }

    bucket.politicians.add(trade.politicianId);

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
        tradeCount,
        purchaseCount: stats.purchases,
        saleCount: stats.sales,
        politicianCount: stats.politicians.size,
        lastTradeDate: stats.lastTradeDate,
        netFlow,
      } satisfies TrendingTicker;
    })
    .sort((a, b) => b.tradeCount - a.tradeCount || b.politicianCount - a.politicianCount)
    .slice(0, limit);
}

export interface MarketPulse {
  totalTrades90d: number;
  avgDisclosureLagDays: number | null;
  slowDisclosureCount: number;
  activePoliticians90d: number;
  purchaseRatio: number;
  hottestTicker: TrendingTicker | null;
}

export function getMarketPulse(trades: UnifiedCongressTrade[]): MarketPulse {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = trades.filter(
    (trade) => new Date(trade.tradeDate).getTime() >= cutoff
  );

  const lags = recent
    .map((trade) => trade.disclosureLagDays)
    .filter((days): days is number => days != null);

  const politicians = new Set(recent.map((trade) => trade.politicianId));
  const purchases = recent.filter((trade) => trade.type === "Purchase").length;
  const trending = getTrendingTickers(trades, 1);

  return {
    totalTrades90d: recent.length,
    avgDisclosureLagDays:
      lags.length > 0
        ? Math.round(lags.reduce((sum, days) => sum + days, 0) / lags.length)
        : null,
    slowDisclosureCount: lags.filter((days) => days > 45).length,
    activePoliticians90d: politicians.size,
    purchaseRatio: recent.length > 0 ? purchases / recent.length : 0,
    hottestTicker: trending[0] ?? null,
  };
}

export interface SectorActivity {
  sector: string;
  count: number;
  tickers: string[];
  purchaseCount: number;
}

export function getSectorActivity(
  trades: UnifiedCongressTrade[],
  limit = 6
): SectorActivity[] {
  const buckets = new Map<
    string,
    { count: number; tickers: Set<string>; purchases: number }
  >();

  for (const trade of trades) {
    const sector = trade.sector?.trim() || "Other";
    const bucket = buckets.get(sector) ?? {
      count: 0,
      tickers: new Set<string>(),
      purchases: 0,
    };

    bucket.count += 1;
    bucket.tickers.add(trade.ticker);
    if (trade.type === "Purchase") {
      bucket.purchases += 1;
    }

    buckets.set(sector, bucket);
  }

  return [...buckets.entries()]
    .map(([sector, stats]) => ({
      sector,
      count: stats.count,
      tickers: [...stats.tickers].slice(0, 5),
      purchaseCount: stats.purchases,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const SECTOR_COMMITTEE_OVERLAP: Record<string, string[]> = {
  Technology: ["Science", "Commerce", "Intelligence"],
  Healthcare: ["Health", "Ways and Means", "Finance"],
  "Health Care": ["Health", "Ways and Means"],
  Pharmaceutical: ["Health", "Energy and Commerce"],
  Finance: ["Financial Services", "Banking", "Finance"],
  Banking: ["Financial Services", "Banking"],
  Energy: ["Energy and Commerce", "Natural Resources"],
  Oil: ["Energy and Commerce", "Natural Resources"],
  Defense: ["Armed Services", "Foreign Affairs"],
  Aerospace: ["Armed Services", "Transportation"],
  Financials: ["Financial Services", "Banking", "Finance"],
  "Consumer Discretionary": ["Commerce", "Energy and Commerce"],
};

export function committeeOverlapsSector(
  committee: string | undefined,
  sector: string
): boolean {
  if (!committee?.trim() || !sector?.trim()) {
    return false;
  }

  const related = SECTOR_COMMITTEE_OVERLAP[sector];
  if (!related) {
    return false;
  }

  const normalizedCommittee = committee.toLowerCase();
  return related.some((name) =>
    normalizedCommittee.includes(name.toLowerCase())
  );
}

export interface OverlapFlag {
  sector: string;
  tickers: string[];
  relatedCommittees: string[];
  severity: "watch" | "notable";
  message: string;
}

export function getCommitteeOverlapFlags(input: {
  trades: UnifiedCongressTrade[];
  committee?: string;
}): OverlapFlag[] {
  const flags: OverlapFlag[] = [];
  const sectorActivity = getSectorActivity(input.trades, 8);
  const committee = input.committee?.toLowerCase() ?? "";

  for (const activity of sectorActivity) {
    const related = SECTOR_COMMITTEE_OVERLAP[activity.sector];
    if (!related) {
      continue;
    }

    const committeeMatch = related.some((name) =>
      committee.includes(name.toLowerCase())
    );

    if (committeeMatch && activity.count >= 1) {
      flags.push({
        sector: activity.sector,
        tickers: activity.tickers,
        relatedCommittees: related,
        severity: activity.count >= 3 ? "notable" : "watch",
        message: `Traded ${activity.count} ${activity.sector} position${activity.count !== 1 ? "s" : ""} (${activity.tickers.join(", ")}) while serving on a committee with jurisdiction over this sector.`,
      });
    } else if (activity.count >= 3 && !committee) {
      flags.push({
        sector: activity.sector,
        tickers: activity.tickers,
        relatedCommittees: related,
        severity: "watch",
        message: `Heavy ${activity.sector} activity (${activity.count} trades). Typical oversight committees: ${related.join(", ")}.`,
      });
    }
  }

  return flags.slice(0, 4);
}

export interface PoliticianLagStats {
  medianLagDays: number | null;
  avgLagDays: number | null;
  slowestTrade: UnifiedCongressTrade | null;
  fastDisclosureRate: number;
}

export function getPoliticianLagStats(
  trades: UnifiedCongressTrade[]
): PoliticianLagStats {
  const lags = trades
    .map((trade) => trade.disclosureLagDays)
    .filter((days): days is number => days != null)
    .sort((a, b) => a - b);

  if (lags.length === 0) {
    return {
      medianLagDays: null,
      avgLagDays: null,
      slowestTrade: null,
      fastDisclosureRate: 0,
    };
  }

  const mid = Math.floor(lags.length / 2);
  const medianLagDays =
    lags.length % 2 === 0 ? (lags[mid - 1] + lags[mid]) / 2 : lags[mid];

  const slowestTrade =
    [...trades]
      .filter((trade) => trade.disclosureLagDays != null)
      .sort((a, b) => (b.disclosureLagDays ?? 0) - (a.disclosureLagDays ?? 0))[0] ??
    null;

  return {
    medianLagDays: Math.round(medianLagDays),
    avgLagDays: Math.round(lags.reduce((sum, days) => sum + days, 0) / lags.length),
    slowestTrade,
    fastDisclosureRate: lags.filter((days) => days <= 30).length / lags.length,
  };
}

export function filterTrades(
  trades: UnifiedCongressTrade[],
  filters: {
    query?: string;
    ticker?: string;
    type?: "all" | "Purchase" | "Sale";
    party?: Party | "all";
    chamber?: Chamber | "all";
    days?: number;
  }
): UnifiedCongressTrade[] {
  const cutoff =
    filters.days != null
      ? Date.now() - filters.days * 24 * 60 * 60 * 1000
      : null;

  return trades.filter((trade) => {
    if (cutoff != null && new Date(trade.tradeDate).getTime() < cutoff) {
      return false;
    }

    if (filters.ticker && trade.ticker.toUpperCase() !== filters.ticker.toUpperCase()) {
      return false;
    }

    if (filters.type && filters.type !== "all" && trade.type !== filters.type) {
      return false;
    }

    if (filters.party && filters.party !== "all" && trade.party !== filters.party) {
      return false;
    }

    if (
      filters.chamber &&
      filters.chamber !== "all" &&
      trade.chamber !== filters.chamber
    ) {
      return false;
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      return (
        trade.politicianName.toLowerCase().includes(q) ||
        trade.ticker.toLowerCase().includes(q) ||
        trade.company.toLowerCase().includes(q) ||
        trade.sector.toLowerCase().includes(q)
      );
    }

    return true;
  });
}
