import { NewTradeAlert } from "@/types/supabase";
import { getSubscribersForPolitician } from "@/lib/supabase/subscriptions";
import {
  getExistingTradeKeys,
  insertNewTrades,
  quiverTradeToRow,
} from "@/lib/supabase/trades";
import { sendTradeAlertsToSubscribers } from "@/lib/resend";
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

  let emailsSent = 0;

  for (const alert of alerts) {
    const subscribers = await getSubscribersForPolitician(alert.politicianName);
    const emails = [...new Set(subscribers.map((sub) => sub.email))];

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
