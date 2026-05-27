import { Party, UnifiedCongressTrade } from "@/types";
import { CapitolTradesRecord } from "@/lib/capitol-trades";
import { slugify } from "@/lib/quiver-mappers";
import { QuiverCongressTrade } from "@/lib/quiverquant";
import { buildTradeKey } from "@/lib/supabase/trades";

export function buildUnifiedTradeMatchKey(trade: Pick<
  UnifiedCongressTrade,
  "politicianId" | "ticker" | "tradeDate" | "type"
>): string {
  return buildTradeKey({
    politicianId: trade.politicianId,
    ticker: trade.ticker,
    tradeDate: trade.tradeDate,
    tradeType: trade.type,
    amountRange: "",
  });
}

export function enrichTradesWithQuiverReturns(
  trades: UnifiedCongressTrade[],
  quiverTrades: QuiverCongressTrade[]
): UnifiedCongressTrade[] {
  const quiverByKey = new Map<string, QuiverCongressTrade>();

  for (const trade of quiverTrades) {
    const politicianId = trade.BioGuideID || slugify(trade.Representative);
    const type =
      trade.Transaction.toLowerCase().includes("purchase") ||
      trade.Transaction.toLowerCase().includes("buy")
        ? "Purchase"
        : "Sale";

    quiverByKey.set(
      buildTradeKey({
        politicianId,
        ticker: trade.Ticker.toUpperCase(),
        tradeDate: trade.TransactionDate,
        tradeType: type,
        amountRange: trade.Range,
      }),
      trade
    );
  }

  return trades.map((trade) => {
    const quiver =
      quiverByKey.get(buildUnifiedTradeMatchKey(trade)) ??
      quiverByKey.get(
        buildTradeKey({
          politicianId: trade.politicianId,
          ticker: trade.ticker,
          tradeDate: trade.tradeDate,
          tradeType: trade.type,
          amountRange: trade.amount,
        })
      );

    if (!quiver) {
      return trade;
    }

    return {
      ...trade,
      excessReturn: trade.excessReturn ?? quiver.ExcessReturn ?? null,
      priceChange: trade.priceChange ?? quiver.PriceChange ?? null,
      spyChange: trade.spyChange ?? quiver.SPYChange ?? null,
      sector: trade.sector || quiver.TickerType || trade.sector,
    };
  });
}

export function enrichTradesWithCapitolTrades(
  trades: UnifiedCongressTrade[],
  capitolRecords: CapitolTradesRecord[]
): UnifiedCongressTrade[] {
  const capitolByKey = new Map<string, CapitolTradesRecord>();

  for (const record of capitolRecords) {
    capitolByKey.set(
      buildTradeKey({
        politicianId: record.politicianId,
        ticker: record.ticker,
        tradeDate: record.tradeDate,
        tradeType: record.type,
        amountRange: record.amount,
      }),
      record
    );
  }

  return trades.map((trade) => {
    const capitol =
      capitolByKey.get(buildUnifiedTradeMatchKey(trade)) ??
      capitolByKey.get(
        buildTradeKey({
          politicianId: trade.politicianId,
          ticker: trade.ticker,
          tradeDate: trade.tradeDate,
          tradeType: trade.type,
          amountRange: trade.amount,
        })
      );

    if (!capitol) {
      return trade;
    }

    return {
      ...trade,
      sector: trade.sector || capitol.sector,
      filingNotes: trade.filingNotes ?? capitol.owner ?? null,
      company: trade.company === trade.ticker ? capitol.company : trade.company,
    };
  });
}

export function mergeSupplementalTrades(
  primary: UnifiedCongressTrade[],
  supplemental: UnifiedCongressTrade[]
): UnifiedCongressTrade[] {
  const seen = new Set(primary.map(buildUnifiedTradeMatchKey));
  const merged = [...primary];

  for (const trade of supplemental) {
    const key = buildUnifiedTradeMatchKey(trade);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(trade);
  }

  return merged;
}

export function capitolRecordToUnified(
  record: CapitolTradesRecord,
  index: number
): UnifiedCongressTrade {
  const party: Party = record.party.toLowerCase().startsWith("d")
    ? "Democrat"
    : record.party.toLowerCase().startsWith("r")
      ? "Republican"
      : "Independent";

  return {
    id: `capitol-${record.politicianId}-${record.tradeDate}-${record.ticker}-${index}`,
    politicianId: record.politicianId,
    politicianName: record.politicianName,
    party,
    chamber: record.chamber.toLowerCase().includes("senate") ? "Senate" : "House",
    ticker: record.ticker,
    company: record.company,
    type: record.type,
    amount: record.amount,
    tradeDate: record.tradeDate,
    filingDate: record.filingDate,
    disclosureLagDays: record.disclosureLagDays,
    sector: record.sector,
    excessReturn: null,
    dataSource: "capitol_trades",
    filingNotes: record.owner ?? null,
  };
}
