import { BRAND, SITE_URL } from "@/lib/brand";
import { TradeOfTheDay } from "@/lib/trade-of-the-day";
import { formatPercent } from "@/lib/utils";

export { SITE_URL };

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

  return `${actionHeadline}${performance}${clusterNote}\n\n${BRAND.name} tracks every disclosed congressional stock trade 👇`;
}

export function buildSiteTweet(url = SITE_URL): string {
  return `Congress has to disclose every stock trade.\n\n${BRAND.name} shows what they bought, what they sold, and who's beating the S&P.\n\nToday's picks update daily 👇`;
}

export function buildTickerTweet(ticker: string, politicianCount: number, url: string): string {
  return `$${ticker}: ${politicianCount} members of Congress traded it recently.\n\nSee every buy, sell, and return vs the S&P on ${BRAND.name} 👇\n${url}/ticker/${ticker}`;
}
