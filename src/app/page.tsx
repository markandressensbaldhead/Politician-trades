import { LeaderboardPanel } from "@/components/leaderboard/leaderboard-panel";
import { DiscoveryRail } from "@/components/dashboard/discovery-rail";
import { HighConvictionFeed } from "@/components/dashboard/high-conviction-feed";
import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { PortfolioCtaBanner } from "@/components/dashboard/portfolio-cta-banner";
import { RetailHero } from "@/components/dashboard/retail-hero";
import { TradeClustersPanel } from "@/components/dashboard/trade-clusters-panel";
import { TradeOfTheDaySpotlight } from "@/components/dashboard/trade-of-the-day-spotlight";
import { TrendingTickers } from "@/components/dashboard/trending-tickers";
import { XNewsPanel } from "@/components/dashboard/x-news-panel";
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
import { getMarketPulse, getTrendingTickers } from "@/lib/trade-analytics";
import { getTradeOfTheDay } from "@/lib/trade-of-the-day";
import { buildTopicalXNews } from "@/lib/x-news";

export default async function HomePage() {
  const [
    { entries, source },
    { trades: recentTrades },
    { trades: allTrades, source: tradeSource },
  ] = await Promise.all([
    getLeaderboardData(),
    getRecentTrades(200),
    getAllTrades(),
  ]);

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
    <SiteContainer className="space-y-10 pb-12">
      <RetailHero
        avgReturnVsSpy={avgReturn}
        topPerformerId={topPerformer?.id ?? ""}
        topPerformerName={topPerformer?.name ?? "—"}
        topPerformerReturn={topPerformer?.returnVsSpy ?? 0}
        topTicker={trending[0]?.ticker ?? null}
        tradeCount90d={pulse.totalTrades90d}
        memberCount={entries.length}
        isLive={isLive}
      />

      {tradeOfTheDay && <TradeOfTheDaySpotlight pick={tradeOfTheDay} />}

      <DiscoveryRail
        topTicker={trending[0] ?? null}
        topPerformer={topPerformer ?? null}
        topCluster={clusters[0] ?? null}
      />

      <XNewsPanel topical={xTopical} />

      <div className="grid gap-8 2xl:grid-cols-2">
        <HighConvictionFeed trades={highConviction} />
        <TradeClustersPanel
          clusters={clusters}
          sectorClusters={sectorClusters}
        />
      </div>

      <MarketPulse pulse={pulse} />

      {trending.length > 0 && (
        <TrendingTickers
          tickers={trending}
          title="What retail is clicking"
          description="The tickers getting the most congressional flow right now — each one is a page full of trades."
        />
      )}

      <PortfolioCtaBanner />

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <LeaderboardPanel entries={sortedEntries} source={source} />
        <LiveTradeFeed
          trades={recentTrades.slice(0, 80)}
          showFilters={false}
          title="Fresh filings"
          description="Just disclosed — click any row before the crowd catches up."
        />
      </div>
    </SiteContainer>
  );
}
