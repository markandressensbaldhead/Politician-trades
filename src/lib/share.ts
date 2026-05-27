import { TradeOfTheDay } from "@/lib/trade-of-the-day";
import { formatPercent } from "@/lib/utils";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://politician-trades.vercel.app";

export function buildXIntentUrl(text: string, url?: string): string {
  const params = new URLSearchParams({ text });
  if (url) {
    params.set("url", url);
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildTradeOfDayTweet(pick: TradeOfTheDay, url = SITE_URL): string {
  const { trade, actionHeadline, cluster } = pick;
  const performance =
    trade.excessReturn != null
      ? ` · ${formatPercent(trade.excessReturn)} vs S&P since filing`
      : "";
  const clusterNote =
    cluster && cluster.politicianCount >= 2
      ? `\n${cluster.politicianCount} lawmakers on $${trade.ticker}.`
      : "";

  return `${actionHeadline}${performance}${clusterNote}\n\nFree tool that tracks every disclosed congressional stock trade 👇`;
}

export function buildSiteTweet(url = SITE_URL): string {
  return `Congress has to disclose every stock trade.\n\nThis free dashboard shows what they bought, what they sold, and who's beating the S&P.\n\nToday's picks update daily 👇`;
}

export function buildTickerTweet(ticker: string, politicianCount: number, url: string): string {
  return `$${ticker}: ${politicianCount} members of Congress traded it recently.\n\nSee every buy, sell, and return vs the S&P — free 👇\n${url}/ticker/${ticker}`;
}
