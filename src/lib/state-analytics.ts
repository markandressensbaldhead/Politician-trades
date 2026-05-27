import { UnifiedCongressTrade } from "@/types";
import { politicians } from "@/lib/data";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  IA: "Iowa",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  MA: "Massachusetts",
  MD: "Maryland",
  ME: "Maine",
  MI: "Michigan",
  MN: "Minnesota",
  MO: "Missouri",
  MS: "Mississippi",
  MT: "Montana",
  NC: "North Carolina",
  ND: "North Dakota",
  NE: "Nebraska",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NV: "Nevada",
  NY: "New York",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VA: "Virginia",
  VT: "Vermont",
  WA: "Washington",
  WI: "Wisconsin",
  WV: "West Virginia",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const politicianStateById = new Map(
  politicians.map((politician) => [politician.id, politician.state.toUpperCase()])
);

const politicianStateByName = new Map(
  politicians.map((politician) => [
    politician.name.toLowerCase(),
    politician.state.toUpperCase(),
  ])
);

export interface StateStats {
  code: string;
  name: string;
  tradeCount: number;
  politicianCount: number;
  purchaseCount: number;
  topTickers: string[];
}

function resolveState(trade: UnifiedCongressTrade): string | null {
  const byId = politicianStateById.get(trade.politicianId);
  if (byId) return byId;

  const byName = politicianStateByName.get(trade.politicianName.toLowerCase());
  if (byName) return byName;

  return null;
}

export function getStateStats(
  trades: UnifiedCongressTrade[],
  options: { days?: number; limit?: number } = {}
): StateStats[] {
  const days = options.days ?? 365 * 3;
  const limit = options.limit ?? 50;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const buckets = new Map<
    string,
    {
      politicians: Set<string>;
      trades: number;
      purchases: number;
      tickers: Map<string, number>;
    }
  >();

  for (const trade of trades) {
    if (new Date(trade.tradeDate).getTime() < cutoff) continue;

    const state = resolveState(trade);
    if (!state) continue;

    const bucket = buckets.get(state) ?? {
      politicians: new Set<string>(),
      trades: 0,
      purchases: 0,
      tickers: new Map<string, number>(),
    };

    bucket.politicians.add(trade.politicianId);
    bucket.trades += 1;
    if (trade.type === "Purchase") bucket.purchases += 1;
    bucket.tickers.set(
      trade.ticker.toUpperCase(),
      (bucket.tickers.get(trade.ticker.toUpperCase()) ?? 0) + 1
    );

    buckets.set(state, bucket);
  }

  return [...buckets.entries()]
    .map(([code, stats]) => ({
      code,
      name: STATE_NAMES[code] ?? code,
      tradeCount: stats.trades,
      politicianCount: stats.politicians.size,
      purchaseCount: stats.purchases,
      topTickers: [...stats.tickers.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([ticker]) => ticker),
    }))
    .sort((a, b) => b.tradeCount - a.tradeCount)
    .slice(0, limit);
}

export function getStateName(code: string): string {
  return STATE_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}
