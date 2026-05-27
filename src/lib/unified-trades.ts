import { UnifiedCongressTrade } from "@/types";
import { politicians } from "@/lib/data";
import { MOCK_TRADE_ENRICHMENT } from "@/lib/mock-enrichment";
import { enrichTradeWithMetadata } from "@/lib/politician-metadata";
import {
  fetchLiveCongressTrades,
  type CongressDataProvider,
} from "@/lib/congress-trade-source";
import {
  getDisclosureLagDays,
  getTrendingTickers,
  TrendingTicker,
} from "@/lib/trade-analytics";
import { buildPoliticianMetaIndex } from "@/lib/unusual-whales";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { CongressTradeRow } from "@/types/supabase";

export type TradeDataSource = "supabase" | "live" | "mock";

function rowToUnified(row: CongressTradeRow, index: number): UnifiedCongressTrade {
  const secData = row.sec_data as Record<string, unknown> | null;
  const source =
    secData?.source === "unusual_whales"
      ? "unusual_whales"
      : secData?.source === "quiverquant"
        ? "quiverquant"
        : undefined;

  return {
    id: row.trade_key || `${row.politician_id}-${index}`,
    politicianId: row.politician_id,
    politicianName: row.politician_name ?? row.politician_id,
    party: "Independent",
    chamber: "House",
    ticker: row.ticker.toUpperCase(),
    company: row.ticker,
    type: row.trade_type === "Purchase" ? "Purchase" : "Sale",
    amount: row.amount_range ?? "Amount undisclosed",
    tradeDate: row.trade_date,
    filingDate: row.filing_date,
    disclosureLagDays: getDisclosureLagDays(row.trade_date, row.filing_date),
    sector: row.sector ?? "",
    excessReturn: row.excess_return,
    dataSource: source,
    uwPoliticianId:
      typeof secData?.uw_politician_id === "string"
        ? secData.uw_politician_id
        : undefined,
    filingNotes:
      typeof secData?.notes === "string" ? secData.notes : null,
    isActiveFiling:
      typeof secData?.is_active === "boolean" ? secData.is_active : undefined,
  };
}

function mockToUnified(): UnifiedCongressTrade[] {
  const rows: UnifiedCongressTrade[] = [];

  for (const politician of politicians) {
    for (const trade of politician.trades) {
      const meta = MOCK_TRADE_ENRICHMENT[trade.id];
      const filingDate = meta?.filingDate ?? trade.date;
      const excessReturn = meta?.excessReturn ?? null;

      rows.push({
        id: `${politician.id}-${trade.id}`,
        politicianId: politician.id,
        politicianName: politician.name,
        party: politician.party,
        chamber: politician.chamber,
        ticker: trade.ticker.toUpperCase(),
        company: trade.company,
        type: trade.type,
        amount: trade.amount,
        tradeDate: trade.date,
        filingDate,
        disclosureLagDays: getDisclosureLagDays(trade.date, filingDate),
        sector: trade.sector,
        excessReturn,
        dataSource: "mock",
      });
    }
  }

  return rows;
}

async function loadFromSupabase(): Promise<UnifiedCongressTrade[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = getSupabaseServerClient();
  const rows: CongressTradeRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("congress_trades")
      .select("*")
      .order("trade_date", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error || !data?.length) {
      break;
    }

    rows.push(...(data as CongressTradeRow[]));

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  if (rows.length === 0) {
    return [];
  }

  const metaIndex = await buildPoliticianMetaIndex().catch(() => new Map());

  return rows.map((row, index) => {
    const unified = enrichTradeWithMetadata(rowToUnified(row, index));
    const meta =
      metaIndex.get(row.politician_id) ??
      (unified.uwPoliticianId
        ? metaIndex.get(unified.uwPoliticianId)
        : undefined);

    if (meta) {
      unified.party = meta.party;
      unified.chamber = meta.chamber;
      unified.politicianName = meta.name;
    }

    return unified;
  });
}

function enrichTrades(trades: UnifiedCongressTrade[]): UnifiedCongressTrade[] {
  return trades.map(enrichTradeWithMetadata);
}

let cache:
  | {
      expiresAt: number;
      trades: UnifiedCongressTrade[];
      source: TradeDataSource;
      provider: CongressDataProvider;
    }
  | undefined;

export async function loadUnifiedTrades(): Promise<{
  trades: UnifiedCongressTrade[];
  source: TradeDataSource;
  provider: CongressDataProvider;
}> {
  if (cache && cache.expiresAt > Date.now()) {
    return {
      trades: cache.trades,
      source: cache.source,
      provider: cache.provider,
    };
  }

  const fromDb = await loadFromSupabase();

  if (fromDb.length >= 50) {
    const trades = enrichTrades(fromDb);
    const provider =
      trades.some((trade) => trade.dataSource === "unusual_whales")
        ? "unusual_whales"
        : trades.some((trade) => trade.dataSource === "quiverquant")
          ? "quiverquant"
          : "none";

    cache = {
      expiresAt: Date.now() + 5 * 60 * 1000,
      trades,
      source: "supabase",
      provider,
    };

    return { trades, source: "supabase", provider };
  }

  const { trades: liveTrades, provider } = await fetchLiveCongressTrades({
    maxPages: 12,
    lookbackMonths: 18,
  });

  if (liveTrades.length > 0) {
    const trades = enrichTrades(liveTrades);
    cache = {
      expiresAt: Date.now() + 5 * 60 * 1000,
      trades,
      source: "live",
      provider,
    };

    return { trades, source: "live", provider };
  }

  const trades = enrichTrades(mockToUnified());
  cache = {
    expiresAt: Date.now() + 5 * 60 * 1000,
    trades,
    source: "mock",
    provider: "none",
  };

  return { trades, source: "mock", provider: "none" };
}

export async function getTradesByTicker(
  ticker: string
): Promise<{ trades: UnifiedCongressTrade[]; source: TradeDataSource }> {
  const { trades, source } = await loadUnifiedTrades();
  const symbol = ticker.toUpperCase();

  return {
    trades: trades
      .filter((trade) => trade.ticker === symbol)
      .sort(
        (a, b) =>
          new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
      ),
    source,
  };
}

export async function getTickerIndex(): Promise<{
  tickers: TrendingTicker[];
  source: TradeDataSource;
}> {
  const { trades, source } = await loadUnifiedTrades();

  return {
    tickers: getTrendingTickers(trades, 50, 365),
    source,
  };
}

export function toLegacyRecentTrade(trade: UnifiedCongressTrade) {
  return {
    id: trade.id,
    ticker: trade.ticker,
    company: trade.company,
    type: trade.type,
    amount: trade.amount,
    date: trade.tradeDate,
    filingDate: trade.filingDate,
    disclosureLagDays: trade.disclosureLagDays,
    sector: trade.sector,
    politicianId: trade.politicianId,
    politicianName: trade.politicianName,
    party: trade.party,
    chamber: trade.chamber,
    excessReturn: trade.excessReturn,
  };
}
