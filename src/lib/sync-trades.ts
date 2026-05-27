import { NewTradeAlert } from "@/types/supabase";
import { getSubscribersForPolitician, getSubscribersForTicker } from "@/lib/supabase/subscriptions";
import {
  getExistingTradeKeys,
  insertNewTrades,
  TradeInsertRow,
} from "@/lib/supabase/trades";
import { sendTradeAlertsToSubscribers } from "@/lib/resend";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { syncSecFilingsForPolitician } from "@/lib/sync-sec-filings";
import {
  fetchLiveCongressTradeRows,
  getPreferredCongressProvider,
} from "@/lib/congress-trade-source";
import { isUnusualWhalesConfigured } from "@/lib/unusual-whales";
import { isFmpConfigured } from "@/lib/fmp-congress";

export interface SyncTradesResult {
  scanned: number;
  inserted: number;
  emailsSent: number;
  provider: ReturnType<typeof getPreferredCongressProvider>;
}

function alertTradeType(tradeType: string): "buy" | "sell" {
  return tradeType === "Purchase" ? "buy" : "sell";
}

export async function syncTradesAndSendAlerts(): Promise<SyncTradesResult> {
  if (
    !isUnusualWhalesConfigured() &&
    !isFmpConfigured() &&
    !process.env.QUIVERQUANT_API_KEY?.trim()
  ) {
    throw new Error(
      "Configure UNUSUAL_WHALES_API_KEY, FMP_API_KEY, or QUIVERQUANT_API_KEY for trade sync"
    );
  }

  const [{ rows: rawRows, provider }, existingKeys] = await Promise.all([
    fetchLiveCongressTradeRows({ maxPages: 24, lookbackMonths: 18 }),
    getExistingTradeKeys(),
  ]);

  const isBootstrap = existingKeys.size === 0;
  const newRows: TradeInsertRow[] = [];
  const alerts: NewTradeAlert[] = [];

  for (const row of rawRows) {
    if (existingKeys.has(row.trade_key)) {
      continue;
    }

    newRows.push(row);
    existingKeys.add(row.trade_key);

    if (!isBootstrap) {
      alerts.push({
        politicianId: row.politician_id,
        politicianName: row.politician_name ?? row.politician_id,
        ticker: row.ticker,
        tradeType: alertTradeType(row.trade_type),
        amountRange: row.amount_range ?? "Amount undisclosed",
        tradeDate: row.trade_date,
      });
    }
  }

  const inserted = await insertNewTrades(newRows);

  if (inserted > 0 && isSupabaseConfigured()) {
    const affectedPoliticians = new Map<
      string,
      { name: string; tickers: Set<string> }
    >();

    for (const row of newRows) {
      const current = affectedPoliticians.get(row.politician_id) ?? {
        name: row.politician_name ?? row.politician_id,
        tickers: new Set<string>(),
      };
      current.tickers.add(row.ticker.toUpperCase());
      affectedPoliticians.set(row.politician_id, current);
    }

    for (const [politicianId, value] of affectedPoliticians) {
      try {
        await syncSecFilingsForPolitician({
          politicianId,
          politicianName: value.name,
          tickers: [...value.tickers],
        });
      } catch (error) {
        console.error(
          `SEC sync failed for ${value.name}:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  let emailsSent = 0;

  for (const alert of alerts) {
    const [politicianSubscribers, tickerSubscribers] = await Promise.all([
      getSubscribersForPolitician(alert.politicianName),
      getSubscribersForTicker(alert.ticker),
    ]);

    const emails = [
      ...new Set([
        ...politicianSubscribers.map((sub) => sub.email),
        ...tickerSubscribers.map((sub) => sub.email),
      ]),
    ];

    if (emails.length === 0) {
      continue;
    }

    emailsSent += await sendTradeAlertsToSubscribers(emails, alert);
  }

  return {
    scanned: rawRows.length,
    inserted,
    emailsSent,
    provider,
  };
}
