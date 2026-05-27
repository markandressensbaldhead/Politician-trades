import type { Metadata } from "next";

import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { TrendingTickers } from "@/components/dashboard/trending-tickers";
import { SiteContainer } from "@/components/layout/site-container";
import { ExportCsvLink } from "@/components/shared/export-csv-button";
import { getAllTrades, getRecentTrades } from "@/lib/congress-data";
import { getMarketPulse, getTrendingTickers } from "@/lib/trade-analytics";

export const metadata: Metadata = {
  title: "Recent Trades",
  description:
    "Browse recent congressional stock trades with filters for ticker, party, and date.",
};

export default async function FeedPage() {
  const [{ trades: allTrades, source }, { trades: recentTrades }] =
    await Promise.all([getAllTrades(), getRecentTrades(500)]);

  const pulse = getMarketPulse(allTrades);
  const trending = getTrendingTickers(allTrades, 12);

  return (
    <SiteContainer>
      <div className="mb-8 space-y-3">
        <p className="page-eyebrow">Recent trades</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Every disclosed congressional trade
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Search by stock ticker, filter by party, and see how long each trade
          took to be reported.
          {source === "supabase" && " Data is synced from our database."}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <ExportCsvLink
            href="/api/export/trades?scope=feed"
            label="Download recent trades"
          />
          <ExportCsvLink
            href="/api/export/trades?scope=all"
            label="Download full history"
          />
        </div>
      </div>

      <div className="space-y-8">
        <MarketPulse pulse={pulse} />
        <TrendingTickers tickers={trending} />
        <LiveTradeFeed trades={recentTrades} />
      </div>
    </SiteContainer>
  );
}
