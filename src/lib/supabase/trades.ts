import { CongressTradeRow } from "@/types/supabase";
import { ProfileTrade } from "@/types";
import { slugify } from "@/lib/quiver-mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeTradeType,
  QuiverCongressTrade,
} from "@/lib/quiverquant";

export interface TradeInsertRow {
  trade_key: string;
  politician_id: string;
  politician_name: string | null;
  ticker: string;
  trade_type: string;
  amount_range: string | null;
  trade_date: string;
  filing_date: string | null;
  sector: string | null;
  excess_return: number | null;
  sec_data?: Record<string, unknown> | null;
}

export function buildTradeKey(input: {
  politicianId: string;
  ticker: string;
  tradeDate: string;
  tradeType: string;
  amountRange?: string | null;
}): string {
  return [
    input.politicianId,
    input.ticker,
    input.tradeDate,
    input.tradeType,
    input.amountRange ?? "",
  ].join("|");
}

export function quiverTradeToRow(trade: QuiverCongressTrade): TradeInsertRow {
  const politicianId = trade.BioGuideID || slugify(trade.Representative);
  const tradeType =
    normalizeTradeType(trade.Transaction) === "buy" ? "Purchase" : "Sale";

  return {
    trade_key: buildTradeKey({
      politicianId,
      ticker: trade.Ticker,
      tradeDate: trade.TransactionDate,
      tradeType,
      amountRange: trade.Range,
    }),
    politician_id: politicianId,
    politician_name: trade.Representative,
    ticker: trade.Ticker,
    trade_type: tradeType,
    amount_range: trade.Range,
    trade_date: trade.TransactionDate,
    filing_date: trade.ReportDate,
    sector: trade.TickerType ?? null,
    excess_return: trade.ExcessReturn ?? null,
    sec_data: { source: "quiverquant" },
  };
}

export function profileTradeToRow(
  politicianId: string,
  politicianName: string,
  trade: ProfileTrade
): TradeInsertRow {
  return {
    trade_key: buildTradeKey({
      politicianId,
      ticker: trade.ticker,
      tradeDate: trade.tradeDate,
      tradeType: trade.type,
      amountRange: trade.amount,
    }),
    politician_id: politicianId,
    politician_name: politicianName,
    ticker: trade.ticker,
    trade_type: trade.type,
    amount_range: trade.amount,
    trade_date: trade.tradeDate,
    filing_date: trade.filingDate,
    sector: trade.sector ?? null,
    excess_return: trade.excessReturn ?? null,
  };
}

export function profileTradesToCongressRows(
  politicianId: string,
  politicianName: string,
  trades: ProfileTrade[]
): CongressTradeRow[] {
  const createdAt = new Date().toISOString();

  return trades.slice(0, 100).map((trade) => {
    const row = profileTradeToRow(politicianId, politicianName, trade);

    return {
      ...row,
      id: row.trade_key,
      created_at: createdAt,
      sec_data: null,
      sec_synced_at: null,
    };
  });
}

function isDuplicateTradeError(message: string, code?: string): boolean {
  return (
    code === "23505" ||
    message.toLowerCase().includes("duplicate key") ||
    message.includes("congress_trades_trade_key_key")
  );
}

export async function getExistingTradeKeys(): Promise<Set<string>> {
  return getExistingTradeKeysForPolitician();
}

export async function getExistingTradeKeysForPolitician(
  politicianId?: string
): Promise<Set<string>> {
  const supabase = getSupabaseServerClient();
  const keys = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase.from("congress_trades").select("trade_key");

    if (politicianId) {
      query = query.eq("politician_id", politicianId);
    }

    const { data, error } = await query.range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch trade keys: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      keys.add(row.trade_key as string);
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return keys;
}

export async function insertNewTrades(rows: TradeInsertRow[]): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = getSupabaseServerClient();
  let inserted = 0;

  for (const row of rows) {
    const { error } = await supabase.from("congress_trades").insert(row);

    if (error) {
      if (isDuplicateTradeError(error.message, error.code)) {
        continue;
      }

      throw new Error(`Failed to insert trades: ${error.message}`);
    }

    inserted += 1;
  }

  return inserted;
}

export async function getTradesForPolitician(
  politicianId: string,
  limit = 100
): Promise<CongressTradeRow[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("congress_trades")
    .select("*")
    .eq("politician_id", politicianId)
    .order("trade_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch trades from Supabase: ${error.message}`);
  }

  return (data ?? []) as CongressTradeRow[];
}

export async function syncPoliticianTradesIfMissing(
  politicianId: string,
  politicianName: string,
  trades: ProfileTrade[]
): Promise<number> {
  if (trades.length === 0) {
    return 0;
  }

  const existingKeys = await getExistingTradeKeysForPolitician(politicianId);
  const newRows = trades
    .slice(0, 100)
    .map((trade) => profileTradeToRow(politicianId, politicianName, trade))
    .filter((row) => !existingKeys.has(row.trade_key));

  return insertNewTrades(newRows);
}

export function formatTradesForAnalysis(
  politicianName: string,
  party: string,
  chamber: string,
  committee: string | undefined,
  trades: CongressTradeRow[]
): string {
  const header = [
    `Politician: ${politicianName}`,
    `Party: ${party}`,
    `Chamber: ${chamber}`,
    committee ? `Committee: ${committee}` : null,
    `Total trades provided: ${trades.length}`,
    "",
    "Trade history (most recent first):",
  ]
    .filter(Boolean)
    .join("\n");

  const tradeLines = trades.map((trade, index) => {
    const secData = trade.sec_data as { filings?: Array<{ form: string; filedAt: string }> } | null;
    const secNote =
      secData?.filings && secData.filings.length > 0
        ? ` | SEC: ${secData.filings
            .slice(0, 2)
            .map((filing) => `${filing.form} (${filing.filedAt})`)
            .join("; ")}`
        : "";

    const lagDays =
      trade.filing_date && trade.trade_date
        ? Math.max(
            0,
            Math.floor(
              (new Date(trade.filing_date).getTime() -
                new Date(trade.trade_date).getTime()) /
                (24 * 60 * 60 * 1000)
            )
          )
        : null;

    const parts = [
      `${index + 1}. Trade ${trade.trade_date}`,
      trade.filing_date ? `Filed ${trade.filing_date}` : null,
      lagDays != null ? `Disclosure lag ${lagDays}d` : null,
      trade.ticker,
      trade.trade_type,
      trade.amount_range ?? "Amount undisclosed",
      trade.sector ? `Sector: ${trade.sector}` : null,
      trade.excess_return != null
        ? `Excess return vs SPY: ${trade.excess_return.toFixed(2)}%`
        : null,
      secNote || null,
    ].filter(Boolean);

    return parts.join(" | ");
  });

  return `${header}\n${tradeLines.join("\n")}`;
}
