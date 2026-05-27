import type { Metadata } from "next";

import { OfficialPtrPanel } from "@/components/dashboard/official-ptr-panel";
import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { TrendingTickers } from "@/components/dashboard/trending-tickers";
import { PageHeader } from "@/components/layout/page-header";
import { SectionBlock } from "@/components/layout/section-block";
import { SiteContainer } from "@/components/layout/site-container";
import { NextDisclosureSync } from "@/components/shared/next-disclosure-sync";
import { BRAND, COPY } from "@/lib/brand";
import { ExportCsvLink } from "@/components/shared/export-csv-button";
import { getAllTrades, getRecentTrades } from "@/lib/congress-data";
import { fetchHousePtrFilings } from "@/lib/house-clerk";
import { getMarketPulse, getTrendingTickers } from "@/lib/trade-analytics";

export const metadata: Metadata = {
  title: "Hill Trades Feed",
  description:
    "Browse recent trades on the Hill with filters for ticker, party, and date.",
};

export default async function FeedPage() {
  const [{ trades: allTrades, source }, { trades: recentTrades }, housePtrFilings] =
    await Promise.all([
      getAllTrades(),
      getRecentTrades(500),
      fetchHousePtrFilings({ limit: 12 }),
    ]);

  const pulse = getMarketPulse(allTrades);
  const trending = getTrendingTickers(allTrades, 12);

  return (
    <SiteContainer className="pb-16">
      <PageHeader
        eyebrow={COPY.hillTrades}
        title={`Every disclosed trade on ${BRAND.hill}`}
        description={
          <>
            Filter by ticker, party, or date range. Each row links to the member
            profile and ticker deep dive.
            {source === "supabase" && " Synced nightly from our database."}
          </>
        }
        actions={
          <>
            <ExportCsvLink
              href="/api/export/trades?scope=feed"
              label="Recent CSV"
            />
            <ExportCsvLink
              href="/api/export/trades?scope=all"
              label="Full history"
            />
          </>
        }
      />

      {source === "supabase" && (
        <NextDisclosureSync variant="card" className="mb-8 max-w-xl" />
      )}

      <div className="space-y-12">
        <SectionBlock title="At a glance">
          <MarketPulse pulse={pulse} />
        </SectionBlock>

        {housePtrFilings.length > 0 && (
          <SectionBlock
            title="Official House filings"
            description="Fresh PTR PDFs from the Clerk of the House."
          >
            <OfficialPtrPanel filings={housePtrFilings} />
          </SectionBlock>
        )}

        {trending.length > 0 && (
          <SectionBlock title="Trending tickers">
            <TrendingTickers tickers={trending} />
          </SectionBlock>
        )}

        <SectionBlock
          title="All recent trades"
          description="Search and filter the full disclosure stream."
        >
          <LiveTradeFeed trades={recentTrades} />
        </SectionBlock>
      </div>
    </SiteContainer>
  );
}
