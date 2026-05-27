import { UnifiedCongressTrade } from "@/types";
import { politicians } from "@/lib/data";
import {
  getDisclosureLagDays,
  getTrendingTickers,
  TrendingTicker,
} from "@/lib/trade-analytics";
import {
  mapChamber,
  mapParty,
  slugify,
} from "@/lib/quiver-mappers";
import {
  fetchCongressTrades,
  normalizeTradeType,
  QuiverCongressTrade,
} from "@/lib/quiverquant";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { CongressTradeRow } from "@/types/supabase";

export type TradeDataSource = "supabase" | "live" | "mock";

function quiverToUnified(trade: QuiverCongressTrade, index: number): UnifiedCongressTrade {
  const politicianId = trade.BioGuideID || slugify(trade.Representative);
  const type = normalizeTradeType(trade.Transaction) === "buy" ? "Purchase" : "Sale";

  return {
    id: `${politicianId}-${trade.TransactionDate}-${trade.Ticker}-${index}`,
    politicianId,
    politicianName: trade.Representative,
    party: mapParty(trade.Party),
    chamber: mapChamber(trade.House),
    ticker: trade.Ticker.toUpperCase(),
    company: trade.Description?.trim() || trade.Ticker,
    type,
    amount: trade.Range || "Amount undisclosed",
    tradeDate: trade.TransactionDate,
    filingDate: trade.ReportDate || null,
    disclosureLagDays: getDisclosureLagDays(
      trade.TransactionDate,
      trade.ReportDate
    ),
    sector: trade.TickerType ?? "",
    excessReturn: trade.ExcessReturn ?? null,
    priceChange: trade.PriceChange ?? null,
    spyChange: trade.SPYChange ?? null,
  };
}

function rowToUnified(row: CongressTradeRow, index: number): UnifiedCongressTrade {
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
  };
}

function mockToUnified(): UnifiedCongressTrade[] {
  const rows: UnifiedCongressTrade[] = [];

  for (const politician of politicians) {
    for (const [index, trade] of politician.trades.entries()) {
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
        filingDate: trade.date,
        disclosureLagDays: getDisclosureLagDays(trade.date, trade.date),
        sector: trade.sector,
        excessReturn: null,
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

  const partyChamberByPolitician = new Map<
    string,
    { party: UnifiedCongressTrade["party"]; chamber: UnifiedCongressTrade["chamber"] }
  >();

  const apiKey = process.env.QUIVERQUANT_API_KEY;
  if (apiKey) {
    try {
      const live = await fetchCongressTrades(apiKey);
      for (const trade of live) {
        const id = trade.BioGuideID || slugify(trade.Representative);
        partyChamberByPolitician.set(id, {
          party: mapParty(trade.Party),
          chamber: mapChamber(trade.House),
        });
      }
    } catch {
      // Enrichment optional
    }
  }

  return rows.map((row, index) => {
    const unified = rowToUnified(row, index);
    const meta = partyChamberByPolitician.get(row.politician_id);

    if (meta) {
      unified.party = meta.party;
      unified.chamber = meta.chamber;
    }

    return unified;
  });
}

let cache:
  | {
      expiresAt: number;
      trades: UnifiedCongressTrade[];
      source: TradeDataSource;
    }
  | undefined;

export async function loadUnifiedTrades(): Promise<{
  trades: UnifiedCongressTrade[];
  source: TradeDataSource;
}> {
  if (cache && cache.expiresAt > Date.now()) {
    return { trades: cache.trades, source: cache.source };
  }

  const fromDb = await loadFromSupabase();

  if (fromDb.length >= 50) {
    cache = {
      expiresAt: Date.now() + 5 * 60 * 1000,
      trades: fromDb,
      source: "supabase",
    };

    return { trades: fromDb, source: "supabase" };
  }

  const apiKey = process.env.QUIVERQUANT_API_KEY;

  if (apiKey) {
    try {
      const live = await fetchCongressTrades(apiKey);

      if (live.length > 0) {
        const trades = live.map(quiverToUnified);

        cache = {
          expiresAt: Date.now() + 5 * 60 * 1000,
          trades,
          source: "live",
        };

        return { trades, source: "live" };
      }
    } catch (error) {
      console.error(
        "Unified trade load failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const trades = mockToUnified();
  cache = {
    expiresAt: Date.now() + 5 * 60 * 1000,
    trades,
    source: "mock",
  };

  return { trades, source: "mock" };
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
