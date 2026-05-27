import type { Metadata } from "next";

import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { TrendingTickers } from "@/components/dashboard/trending-tickers";
import { ExportCsvLink } from "@/components/shared/export-csv-button";
import { getAllTrades, getRecentTrades } from "@/lib/congress-data";
import { getMarketPulse, getTrendingTickers } from "@/lib/trade-analytics";

export const metadata: Metadata = {
  title: "Live Feed",
  description:
    "Filterable congressional trade firehose with disclosure lag, ticker search, and party filters.",
};

export default async function FeedPage() {
  const [{ trades: allTrades, source }, { trades: recentTrades }] =
    await Promise.all([getAllTrades(), getRecentTrades(500)]);

  const pulse = getMarketPulse(allTrades);
  const trending = getTrendingTickers(allTrades, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-terminal-amber">
          Live Feed
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Congressional Trade Firehose
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Every disclosed trade in one filterable stream — search by ticker,
          filter by party, and see disclosure lag on every row.
          {source === "supabase" && " Reading from locked database cache."}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <ExportCsvLink
            href="/api/export/trades?scope=feed"
            label="Export feed (500 rows)"
          />
          <ExportCsvLink
            href="/api/export/trades?scope=all"
            label="Export full database"
          />
        </div>
      </div>

      <div className="space-y-6">
        <MarketPulse pulse={pulse} />
        <TrendingTickers tickers={trending} />
        <LiveTradeFeed trades={recentTrades} />
      </div>
    </div>
  );
}
