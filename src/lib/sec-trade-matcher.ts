import { EdgarFiling, TradeSecSnapshot } from "@/types";
import { buildTradeKey, TradeInsertRow } from "@/lib/supabase/trades";

const COMPANY_FILING_WINDOW_DAYS = 90;
const INSIDER_FILING_WINDOW_DAYS = 45;

function daysBetween(left: string, right: string): number {
  const a = new Date(left);
  const b = new Date(right);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.abs(a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000);
}

function filingMatchesTrade(trade: TradeInsertRow, filing: EdgarFiling): boolean {
  const anchorDate = trade.filing_date ?? trade.trade_date;
  const ticker = trade.ticker.toUpperCase();
  const filingTicker = filing.ticker?.toUpperCase();

  if (filingTicker === ticker) {
    const window =
      filing.category === "insider"
        ? INSIDER_FILING_WINDOW_DAYS
        : COMPANY_FILING_WINDOW_DAYS;

    if (daysBetween(filing.filedAt, anchorDate) <= window) {
      return true;
    }

    if (daysBetween(filing.filedAt, trade.trade_date) <= window) {
      return true;
    }
  }

  if (
    filing.source === "politician-search" &&
    (filing.category === "insider" || filing.form.replace(/\/.*/, "") === "4")
  ) {
    return daysBetween(filing.filedAt, trade.trade_date) <= INSIDER_FILING_WINDOW_DAYS;
  }

  return false;
}

export function matchFilingsToTrade(
  trade: TradeInsertRow,
  filings: EdgarFiling[]
): EdgarFiling[] {
  return filings
    .filter((filing) => filingMatchesTrade(trade, filing))
    .sort((a, b) => {
      const anchorDate = trade.filing_date ?? trade.trade_date;
      const diffA = daysBetween(a.filedAt, anchorDate);
      const diffB = daysBetween(b.filedAt, anchorDate);

      if (diffA !== diffB) {
        return diffA - diffB;
      }

      return b.priority - a.priority;
    });
}

export function buildTradeSecSnapshot(
  trade: TradeInsertRow,
  filings: EdgarFiling[],
  syncedAt: string
): TradeSecSnapshot {
  const matched = matchFilingsToTrade(trade, filings);

  return {
    syncedAt,
    filings: matched,
    primaryFilingId: matched[0]?.id,
  };
}

export function buildTradeKeyForRow(trade: TradeInsertRow): string {
  return buildTradeKey({
    politicianId: trade.politician_id,
    ticker: trade.ticker,
    tradeDate: trade.trade_date,
    tradeType: trade.trade_type,
    amountRange: trade.amount_range,
  });
}

export function attachTradeKeysToFilings(
  trades: TradeInsertRow[],
  filings: EdgarFiling[]
): Map<string, string[]> {
  const filingTradeKeys = new Map<string, string[]>();

  for (const trade of trades) {
    const tradeKey = buildTradeKeyForRow(trade);
    const matched = matchFilingsToTrade(trade, filings);

    for (const filing of matched) {
      const existing = filingTradeKeys.get(filing.id) ?? [];
      existing.push(tradeKey);
      filingTradeKeys.set(filing.id, existing);
    }
  }

  return filingTradeKeys;
}
