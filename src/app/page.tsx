import { LeaderboardPanel } from "@/components/leaderboard/leaderboard-panel";
import { CongressStatsPanel } from "@/components/dashboard/congress-stats-panel";
import { OfficialPtrPanel } from "@/components/dashboard/official-ptr-panel";
import { DiscoveryRail } from "@/components/dashboard/discovery-rail";
import { EdgeLeadersPanel } from "@/components/dashboard/edge-leaders-panel";
import { HighConvictionFeed } from "@/components/dashboard/high-conviction-feed";
import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { PortfolioCtaBanner } from "@/components/dashboard/portfolio-cta-banner";
import { RetailHero } from "@/components/dashboard/retail-hero";
import { TradeClustersPanel } from "@/components/dashboard/trade-clusters-panel";
import { TradeOfTheDaySpotlight } from "@/components/dashboard/trade-of-the-day-spotlight";
import { TrendingTickers } from "@/components/dashboard/trending-tickers";
import { XNewsPanel } from "@/components/dashboard/x-news-panel";
import { SectionBlock } from "@/components/layout/section-block";
import { SiteContainer } from "@/components/layout/site-container";
import {
  getAllTrades,
  getLeaderboardData,
  getRecentTrades,
} from "@/lib/congress-data";
import {
  buildClusterIndex,
  getSectorClusters,
  getTradeClusters,
} from "@/lib/trade-clusters";
import { getHighConvictionTrades } from "@/lib/trade-significance";
import { buildPoliticianMetadataIndex } from "@/lib/politician-metadata";
import { COPY } from "@/lib/brand";
import { getMarketPulse, getTrendingTickers } from "@/lib/trade-analytics";
import { getTradeOfTheDay } from "@/lib/trade-of-the-day";
import { buildTopicalXNews } from "@/lib/x-news";
import {
  fetchCongressUnusualTradeStats,
  isUnusualWhalesConfigured,
} from "@/lib/unusual-whales";
import { fetchHousePtrFilings } from "@/lib/house-clerk";

export default async function HomePage() {
  const [
    { entries, source },
    { trades: recentTrades },
    { trades: allTrades, source: tradeSource, provider },
  ] = await Promise.all([
    getLeaderboardData(),
    getRecentTrades(200),
    getAllTrades(),
  ]);

  const congressStats =
    isUnusualWhalesConfigured()
      ? await fetchCongressUnusualTradeStats().catch(() => null)
      : null;
  const housePtrFilings = await fetchHousePtrFilings({ limit: 6 });

  const pulse = getMarketPulse(allTrades);
  const trending = getTrendingTickers(allTrades, 12);
  const clusters = getTradeClusters(allTrades, {
    days: 90,
    minPoliticians: 2,
    limit: 5,
  });
  const sectorClusters = getSectorClusters(allTrades, {
    days: 90,
    minPoliticians: 3,
    limit: 4,
  });
  const clusterIndex = buildClusterIndex(clusters);
  const politicianIndex = buildPoliticianMetadataIndex(
    allTrades,
    entries.map((entry) => ({
      id: entry.id,
      returnVsSpy: entry.returnVsSpy,
      edgeScore: entry.edgeScore,
      edgeTier: entry.edgeTier,
      edgeWinRate: entry.edgeWinRate,
      edgeLabel: entry.edgeLabel,
      edgeActionHint: entry.edgeActionHint,
    }))
  );
  const highConviction = getHighConvictionTrades(allTrades, 6, clusterIndex, {
    days: 90,
    politicianIndex,
    diversify: true,
  });
  const tradeOfTheDay = getTradeOfTheDay(allTrades, {
    clusterIndex,
    politicianIndex,
    clusters,
    days: 45,
    minScore: 40,
  });

  const sortedEntries = [...entries].sort(
    (a, b) => b.returnVsSpy - a.returnVsSpy
  );
  const topPerformer = sortedEntries[0];
  const avgReturn =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.returnVsSpy, 0) /
        entries.length
      : 0;
  const isLive = source === "live" || tradeSource === "supabase";
  const xTopical = buildTopicalXNews({
    tradeOfTheDay,
    clusters,
    trending,
    highConviction,
  });

  return (
    <SiteContainer className="space-y-14 pb-16 sm:space-y-16">
      <RetailHero
        avgReturnVsSpy={avgReturn}
        topPerformerId={topPerformer?.id ?? ""}
        topPerformerName={topPerformer?.name ?? "—"}
        topPerformerReturn={topPerformer?.returnVsSpy ?? 0}
        topTicker={trending[0]?.ticker ?? null}
        tradeCount90d={pulse.totalTrades90d}
        memberCount={entries.length}
        isLive={isLive}
        dataProvider={provider}
      />

      {tradeOfTheDay && <TradeOfTheDaySpotlight pick={tradeOfTheDay} />}

      <SectionBlock
        title="Quick paths"
        description="Jump to the highest-signal views without digging through menus."
      >
        <DiscoveryRail
          topTicker={trending[0] ?? null}
          topPerformer={topPerformer ?? null}
          topCluster={clusters[0] ?? null}
        />
      </SectionBlock>

      <SectionBlock
        title="Who has repeatable edge"
        description="Members ranked by consistency and hit rate — not one lucky headline trade."
      >
        <EdgeLeadersPanel entries={sortedEntries} />
      </SectionBlock>

      <SectionBlock
        id="x-news"
        title="Market pulse on X"
        description="Curated posts tied to today's Hill activity."
      >
        <XNewsPanel topical={xTopical} />
      </SectionBlock>

      <SectionBlock
        title="High-conviction moves"
        description="Trades with size, timing, and crowd overlap worth a closer look."
      >
        <div className="grid gap-8 2xl:grid-cols-2">
          <HighConvictionFeed trades={highConviction} />
          <TradeClustersPanel
            clusters={clusters}
            sectorClusters={sectorClusters}
          />
        </div>
      </SectionBlock>

      <SectionBlock
        title="Activity snapshot"
        description="Volume, disclosure lag, and buy/sell mix across the last 90 days."
      >
        <MarketPulse pulse={pulse} />
      </SectionBlock>

      {trending.length > 0 && (
        <SectionBlock
          title="Hot on the Hill"
          description={`Tickers with the most ${COPY.hillFlow} — each opens a full trade history.`}
        >
          <TrendingTickers tickers={trending} embedded />
        </SectionBlock>
      )}

      {(congressStats || housePtrFilings.length > 0) && (
        <SectionBlock
          title="Source intelligence"
          description="Supplemental feeds from data partners and official House filings."
        >
          <div className="space-y-6">
            {congressStats && <CongressStatsPanel stats={congressStats} />}
            <OfficialPtrPanel filings={housePtrFilings} />
          </div>
        </SectionBlock>
      )}

      <PortfolioCtaBanner />

      <SectionBlock
        title="Leaderboard & live feed"
        description="Compare member performance and scan the freshest disclosures side by side."
      >
        <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <LeaderboardPanel entries={sortedEntries} source={source} />
          <LiveTradeFeed
            trades={recentTrades.slice(0, 80)}
            showFilters={false}
            title="Fresh from the Hill"
            description="Just disclosed — tap any row for the full profile or ticker view."
          />
        </div>
      </SectionBlock>
    </SiteContainer>
  );
}
