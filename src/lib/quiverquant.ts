export interface QuiverCongressTrade {
  Representative: string;
  BioGuideID: string;
  ReportDate: string;
  TransactionDate: string;
  Ticker: string;
  Transaction: string;
  Range: string;
  House: string;
  Amount: string;
  Party: string;
  last_modified: string;
  TickerType?: string;
  Description?: string | null;
  ExcessReturn?: number;
  PriceChange?: number;
  SPYChange?: number;
}

export interface ParsedCongressTrade {
  politicianName: string;
  ticker: string;
  tradeType: "buy" | "sell";
  amountRange: string;
  tradeDate: string;
  filingDate: string;
}

export function normalizeTradeType(transaction: string): "buy" | "sell" {
  const lower = transaction.toLowerCase();

  if (lower.includes("purchase") || lower.includes("buy")) {
    return "buy";
  }

  return "sell";
}

export function parseCongressTrade(
  trade: QuiverCongressTrade
): ParsedCongressTrade {
  return {
    politicianName: trade.Representative,
    ticker: trade.Ticker,
    tradeType: normalizeTradeType(trade.Transaction),
    amountRange: trade.Range,
    tradeDate: trade.TransactionDate,
    filingDate: trade.ReportDate,
  };
}

export function parseCongressTrades(
  trades: QuiverCongressTrade[]
): ParsedCongressTrade[] {
  return trades.map(parseCongressTrade);
}

const QUIVER_CONGRESS_TRADING_URL =
  "https://api.quiverquant.com/beta/live/congresstrading";

export async function fetchCongressTrades(
  apiKey: string
): Promise<QuiverCongressTrade[]> {
  const response = await fetch(QUIVER_CONGRESS_TRADING_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `QuiverQuant API error (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Unexpected QuiverQuant API response format");
  }

  return data as QuiverCongressTrade[];
}
