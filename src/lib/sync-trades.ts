import { NewTradeAlert } from "@/types/supabase";
import { getSubscribersForPolitician, getSubscribersForTicker } from "@/lib/supabase/subscriptions";
import {
  getExistingTradeKeys,
  insertNewTrades,
  quiverTradeToRow,
} from "@/lib/supabase/trades";
import { sendTradeAlertsToSubscribers } from "@/lib/resend";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { syncSecFilingsForPolitician } from "@/lib/sync-sec-filings";
import {
  fetchCongressTrades,
  normalizeTradeType,
} from "@/lib/quiverquant";

export interface SyncTradesResult {
  scanned: number;
  inserted: number;
  emailsSent: number;
}

export async function syncTradesAndSendAlerts(): Promise<SyncTradesResult> {
  const apiKey = process.env.QUIVERQUANT_API_KEY;

  if (!apiKey) {
    throw new Error("QUIVERQUANT_API_KEY is not configured");
  }

  const [rawTrades, existingKeys] = await Promise.all([
    fetchCongressTrades(apiKey),
    getExistingTradeKeys(),
  ]);

  const isBootstrap = existingKeys.size === 0;
  const newRows = [];
  const alerts: NewTradeAlert[] = [];

  for (const trade of rawTrades) {
    const row = quiverTradeToRow(trade);

    if (existingKeys.has(row.trade_key)) {
      continue;
    }

    newRows.push(row);
    existingKeys.add(row.trade_key);

    if (!isBootstrap) {
      alerts.push({
        politicianId: row.politician_id,
        politicianName: row.politician_name ?? trade.Representative,
        ticker: row.ticker,
        tradeType: normalizeTradeType(trade.Transaction),
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
    scanned: rawTrades.length,
    inserted,
    emailsSent,
  };
}
