import { UnifiedCongressTrade } from "@/types";
import { getDisclosureLagDays } from "@/lib/trade-analytics";
import {
  capitolRecordToUnified,
  enrichTradesWithCapitolTrades,
  enrichTradesWithQuiverReturns,
  mergeSupplementalTrades,
} from "@/lib/congress-enrichment";
import {
  fetchCapitolTradesRecent,
  isCapitolTradesConfigured,
} from "@/lib/capitol-trades";
import {
  fetchFmpCongressTrades,
  isFmpConfigured,
} from "@/lib/fmp-congress";
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

export type CongressDataProvider =
  | "unusual_whales"
  | "quiverquant"
  | "fmp"
  | "mixed"
  | "none";

export function getPreferredCongressProvider(): CongressDataProvider {
  if (isUnusualWhalesConfigured()) return "unusual_whales";
  if (isFmpConfigured()) return "fmp";
  if (process.env.QUIVERQUANT_API_KEY?.trim()) return "quiverquant";
  return "none";
}

function unifiedToRow(trade: UnifiedCongressTrade): TradeInsertRow {
  return {
    trade_key: buildTradeKey({
      politicianId: trade.politicianId,
      ticker: trade.ticker,
      tradeDate: trade.tradeDate,
      tradeType: trade.type,
      amountRange: trade.amount,
    }),
    politician_id: trade.politicianId,
    politician_name: trade.politicianName,
    ticker: trade.ticker,
    trade_type: trade.type,
    amount_range: trade.amount,
    trade_date: trade.tradeDate,
    filing_date: trade.filingDate,
    sector: trade.sector || null,
    excess_return: trade.excessReturn,
    sec_data: {
      source: trade.dataSource ?? "unknown",
      uw_politician_id: trade.uwPoliticianId ?? null,
      notes: trade.filingNotes ?? null,
      is_active: trade.isActiveFiling ?? null,
    },
  };
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
  return unifiedToRow(unusualWhalesTradeToUnified(trade, 0));
}

export function quiverTradeToRowFromSource(trade: QuiverCongressTrade): TradeInsertRow {
  return unifiedToRow(quiverToUnified(trade, 0));
}

function monthsAgoIso(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

async function loadQuiverTrades(): Promise<QuiverCongressTrade[]> {
  const quiverKey = process.env.QUIVERQUANT_API_KEY?.trim();
  if (!quiverKey) return [];

  try {
    return await fetchCongressTrades(quiverKey);
  } catch (error) {
    console.error(
      "QuiverQuant congress trade fetch failed:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

async function enrichCongressTrades(
  trades: UnifiedCongressTrade[],
  primaryProvider: CongressDataProvider
): Promise<{ trades: UnifiedCongressTrade[]; provider: CongressDataProvider }> {
  let enriched = trades;
  const supplementalSources: CongressDataProvider[] =
    primaryProvider === "none" ? [] : [primaryProvider];

  const quiverTrades = await loadQuiverTrades();
  if (quiverTrades.length > 0) {
    enriched = enrichTradesWithQuiverReturns(enriched, quiverTrades);
    if (primaryProvider !== "quiverquant") {
      supplementalSources.push("quiverquant");
    }
  }

  if (isCapitolTradesConfigured()) {
    const capitolRecords = await fetchCapitolTradesRecent({
      pageSize: 100,
      maxPages: 4,
    }).catch(() => []);

    if (capitolRecords.length > 0) {
      enriched = enrichTradesWithCapitolTrades(enriched, capitolRecords);

      if (primaryProvider === "none" || enriched.length < 50) {
        const capitolUnified = capitolRecords.map(capitolRecordToUnified);
        enriched = mergeSupplementalTrades(enriched, capitolUnified);
      }
    }
  }

  if (isFmpConfigured()) {
    const fmpTrades = await fetchFmpCongressTrades({
      maxPages: 6,
      lookbackMonths: 18,
    }).catch(() => []);

    if (fmpTrades.length > 0) {
      if (primaryProvider === "none" || enriched.length < 50) {
        enriched = mergeSupplementalTrades(enriched, fmpTrades);
      } else {
        enriched = mergeSupplementalTrades(enriched, fmpTrades.slice(0, 250));
      }
      supplementalSources.push("fmp");
    }
  }

  const uniqueSources = [...new Set(supplementalSources)];
  const provider: CongressDataProvider =
    uniqueSources.length > 1
      ? "mixed"
      : uniqueSources[0] === "fmp"
        ? "fmp"
        : uniqueSources[0] === "quiverquant"
          ? "quiverquant"
          : uniqueSources[0] === "unusual_whales"
            ? "unusual_whales"
            : "none";

  return { trades: enriched, provider };
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
        const trades = rawTrades.map((trade, index) => {
          const slug = resolvePoliticianId(trade);
          const meta = metaIndex.get(slug) ?? metaIndex.get(trade.politician_id);
          return unusualWhalesTradeToUnified(trade, index, meta);
        });

        return enrichCongressTrades(trades, "unusual_whales");
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
        return enrichCongressTrades(live.map(quiverToUnified), "quiverquant");
      }
    } catch (error) {
      console.error(
        "QuiverQuant congress trade fetch failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  if (isFmpConfigured()) {
    try {
      const fmpTrades = await fetchFmpCongressTrades({
        maxPages: options.maxPages ?? 8,
        lookbackMonths: options.lookbackMonths ?? 18,
      });

      if (fmpTrades.length > 0) {
        return enrichCongressTrades(fmpTrades, "fmp");
      }
    } catch (error) {
      console.error(
        "FMP congress trade fetch failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return enrichCongressTrades([], "none");
}

export async function fetchLiveCongressTradeRows(options: {
  maxPages?: number;
  lookbackMonths?: number;
} = {}): Promise<{
  rows: TradeInsertRow[];
  provider: CongressDataProvider;
}> {
  const { trades, provider } = await fetchLiveCongressTrades(options);
  return {
    rows: trades.map(unifiedToRow),
    provider,
  };
}
