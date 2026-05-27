import { UnifiedCongressTrade } from "@/types";
import { getDisclosureLagDays } from "@/lib/trade-analytics";
import { slugify } from "@/lib/quiver-mappers";
import { fetchCongressTrades, QuiverCongressTrade } from "@/lib/quiverquant";
import {
  buildPoliticianMetaIndex,
  fetchAllPoliticianTrades,
  isUnusualWhalesConfigured,
  mapUnusualWhalesChamber,
  mapUnusualWhalesParty,
  mapUnusualWhalesTradeType,
  resolvePoliticianId,
  UnusualWhalesTrade,
} from "@/lib/unusual-whales";
import { TradeInsertRow, buildTradeKey } from "@/lib/supabase/trades";

export type CongressDataProvider = "unusual_whales" | "quiverquant" | "none";

export function getPreferredCongressProvider(): CongressDataProvider {
  if (isUnusualWhalesConfigured()) return "unusual_whales";
  if (process.env.QUIVERQUANT_API_KEY?.trim()) return "quiverquant";
  return "none";
}

function quiverToUnified(trade: QuiverCongressTrade, index: number): UnifiedCongressTrade {
  const politicianId = trade.BioGuideID || slugify(trade.Representative);
  const type =
    trade.Transaction.toLowerCase().includes("purchase") ||
    trade.Transaction.toLowerCase().includes("buy")
      ? "Purchase"
      : "Sale";

  return {
    id: `${politicianId}-${trade.TransactionDate}-${trade.Ticker}-${index}`,
    politicianId,
    politicianName: trade.Representative,
    party: mapUnusualWhalesParty(trade.Party),
    chamber: trade.House.toLowerCase() === "senate" ? "Senate" : "House",
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
    dataSource: "quiverquant",
  };
}

export function unusualWhalesTradeToUnified(
  trade: UnusualWhalesTrade,
  index: number,
  meta?: {
    party?: UnifiedCongressTrade["party"];
    chamber?: UnifiedCongressTrade["chamber"];
  }
): UnifiedCongressTrade {
  const politicianId = resolvePoliticianId(trade);
  const type = mapUnusualWhalesTradeType(trade.txn_type);

  return {
    id: `${politicianId}-${trade.transaction_date}-${trade.ticker}-${index}`,
    politicianId,
    politicianName: trade.name,
    party: meta?.party ?? mapUnusualWhalesParty(trade.party),
    chamber: meta?.chamber ?? mapUnusualWhalesChamber(trade.member_type, trade.chamber),
    ticker: trade.ticker.toUpperCase(),
    company: trade.issuer && trade.issuer !== "not-disclosed" ? trade.issuer : trade.ticker,
    type,
    amount: trade.amounts || "Amount undisclosed",
    tradeDate: trade.transaction_date,
    filingDate: trade.filed_at_date || null,
    disclosureLagDays: getDisclosureLagDays(
      trade.transaction_date,
      trade.filed_at_date
    ),
    sector: "",
    excessReturn: null,
    dataSource: "unusual_whales",
    uwPoliticianId: trade.politician_id,
    filingNotes: trade.notes ?? null,
    isActiveFiling: trade.is_active,
  };
}

export function unusualWhalesTradeToRow(trade: UnusualWhalesTrade): TradeInsertRow {
  const politicianId = resolvePoliticianId(trade);
  const tradeType = mapUnusualWhalesTradeType(trade.txn_type);

  return {
    trade_key: buildTradeKey({
      politicianId,
      ticker: trade.ticker.toUpperCase(),
      tradeDate: trade.transaction_date,
      tradeType,
      amountRange: trade.amounts,
    }),
    politician_id: politicianId,
    politician_name: trade.name,
    ticker: trade.ticker.toUpperCase(),
    trade_type: tradeType,
    amount_range: trade.amounts,
    trade_date: trade.transaction_date,
    filing_date: trade.filed_at_date,
    sector: null,
    excess_return: null,
    sec_data: {
      source: "unusual_whales",
      uw_politician_id: trade.politician_id,
      notes: trade.notes ?? null,
      issuer: trade.issuer ?? null,
      reporter: trade.reporter ?? null,
      is_active: trade.is_active ?? null,
      member_type: trade.member_type ?? null,
    },
  };
}

export function quiverTradeToRowFromSource(trade: QuiverCongressTrade): TradeInsertRow {
  const politicianId = trade.BioGuideID || slugify(trade.Representative);
  const tradeType =
    trade.Transaction.toLowerCase().includes("purchase") ||
    trade.Transaction.toLowerCase().includes("buy")
      ? "Purchase"
      : "Sale";

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
    sec_data: {
      source: "quiverquant",
    },
  };
}

function monthsAgoIso(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

export async function fetchLiveCongressTrades(options: {
  maxPages?: number;
  lookbackMonths?: number;
} = {}): Promise<{
  trades: UnifiedCongressTrade[];
  provider: CongressDataProvider;
}> {
  if (isUnusualWhalesConfigured()) {
    try {
      const [rawTrades, metaIndex] = await Promise.all([
        fetchAllPoliticianTrades({
          maxPages: options.maxPages ?? 24,
          transactionNewerThan: monthsAgoIso(options.lookbackMonths ?? 18),
        }),
        buildPoliticianMetaIndex(),
      ]);

      if (rawTrades.length > 0) {
        return {
          trades: rawTrades.map((trade, index) => {
            const slug = resolvePoliticianId(trade);
            const meta = metaIndex.get(slug) ?? metaIndex.get(trade.politician_id);
            return unusualWhalesTradeToUnified(trade, index, meta);
          }),
          provider: "unusual_whales",
        };
      }
    } catch (error) {
      console.error(
        "Unusual Whales congress trade fetch failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const quiverKey = process.env.QUIVERQUANT_API_KEY?.trim();
  if (quiverKey) {
    try {
      const live = await fetchCongressTrades(quiverKey);
      if (live.length > 0) {
        return {
          trades: live.map(quiverToUnified),
          provider: "quiverquant",
        };
      }
    } catch (error) {
      console.error(
        "QuiverQuant congress trade fetch failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return { trades: [], provider: "none" };
}

export async function fetchLiveCongressTradeRows(options: {
  maxPages?: number;
  lookbackMonths?: number;
} = {}): Promise<{
  rows: TradeInsertRow[];
  provider: CongressDataProvider;
}> {
  if (isUnusualWhalesConfigured()) {
    try {
      const raw = await fetchAllPoliticianTrades({
        maxPages: options.maxPages ?? 24,
        transactionNewerThan: monthsAgoIso(options.lookbackMonths ?? 18),
      });

      if (raw.length > 0) {
        return {
          rows: raw.map(unusualWhalesTradeToRow),
          provider: "unusual_whales",
        };
      }
    } catch (error) {
      console.error(
        "Unusual Whales row fetch failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const quiverKey = process.env.QUIVERQUANT_API_KEY?.trim();
  if (quiverKey) {
    try {
      const live = await fetchCongressTrades(quiverKey);
      if (live.length > 0) {
        return {
          rows: live.map(quiverTradeToRowFromSource),
          provider: "quiverquant",
        };
      }
    } catch (error) {
      console.error(
        "QuiverQuant row fetch failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return { rows: [], provider: "none" };
}
