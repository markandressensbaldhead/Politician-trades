import { NewTradeAlert } from "@/types/supabase";
import { BRAND } from "@/lib/brand";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? BRAND.url;
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? BRAND.emailFrom;
}

function formatTradeType(tradeType: "buy" | "sell"): string {
  return tradeType === "buy" ? "Buy" : "Sell";
}

function buildTradeAlertEmail(alert: NewTradeAlert): {
  subject: string;
  html: string;
} {
  const profileUrl = `${getAppUrl()}/politician/${encodeURIComponent(alert.politicianId)}`;
  const actionLabel = formatTradeType(alert.tradeType);
  const actionColor = alert.tradeType === "buy" ? "#22c55e" : "#ef4444";

  return {
    subject: `New ${actionLabel}: ${alert.politicianName} traded ${alert.ticker}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <div style="background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px 12px 0 0;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.04em; color: #93c5fd;">
            Trade alert
          </p>
          <h1 style="margin: 0; font-size: 24px;">New Congressional Trade</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-top: 0;">
            <strong>${alert.politicianName}</strong> reported a new trade:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Ticker</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${alert.ticker}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Action</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${actionColor};">${actionLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Amount</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${alert.amountRange}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Trade Date</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${alert.tradeDate}</td>
            </tr>
          </table>
          <a href="${profileUrl}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
            View Profile
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
            You received this because you subscribed to trade alerts for ${alert.politicianName}.
          </p>
        </div>
      </div>
    `,
  };
}

export async function sendTradeAlertEmail(
  to: string,
  alert: NewTradeAlert
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const { subject, html } = buildTradeAlertEmail(alert);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Resend API error (${response.status}): ${errorBody || response.statusText}`
    );
  }
}

export async function sendTradeAlertsToSubscribers(
  subscribers: string[],
  alert: NewTradeAlert
): Promise<number> {
  let sent = 0;

  for (const email of subscribers) {
    await sendTradeAlertEmail(email, alert);
    sent += 1;
  }

  return sent;
}
