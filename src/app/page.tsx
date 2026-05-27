import { LeaderboardPanel } from "@/components/leaderboard/leaderboard-panel";
import { HighConvictionFeed } from "@/components/dashboard/high-conviction-feed";
import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { TradeClustersPanel } from "@/components/dashboard/trade-clusters-panel";
import { TrendingTickerStrip, TrendingTickers } from "@/components/dashboard/trending-tickers";
import { TrumpSpotlight } from "@/components/dashboard/trump-spotlight";
import {
  getAllTrades,
  getLeaderboardData,
  getRecentTrades,
} from "@/lib/congress-data";
import { buildClusterIndex, getTradeClusters } from "@/lib/trade-clusters";
import { getHighConvictionTrades } from "@/lib/trade-significance";
import { getMarketPulse, getTrendingTickers } from "@/lib/trade-analytics";
import { cn, formatPercent } from "@/lib/utils";

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
  const clusters = getTradeClusters(allTrades, { days: 30, minPoliticians: 2, limit: 6 });
  const clusterIndex = buildClusterIndex(clusters);
  const highConviction = getHighConvictionTrades(allTrades, 6, clusterIndex);
  const totalTrades = entries.reduce(
    (sum, entry) => sum + entry.tradesLast90Days,
    0
  );
  const avgReturn =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.returnVsSpy, 0) /
        entries.length
      : 0;
  const topPerformer = entries[0];
  const dataLabel =
    tradeSource === "supabase"
      ? "Updated"
      : source === "live"
        ? "Live"
        : "Sample";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="page-eyebrow">Congressional stock tracker</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              See what lawmakers are buying and selling
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Follow disclosed trades, compare returns to the S&amp;P 500, and
              read plain-English summaries of what each filing means.
            </p>
            {source === "mock" && (
              <p className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                You&apos;re viewing sample data. Connect a data provider in
                settings to see live congressional trades.
              </p>
            )}
          </div>

          <div className="stat-strip grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:min-w-[420px]">
            <StatTile label="Data" value={dataLabel} />
            <StatTile label="Members tracked" value={String(entries.length)} />
            <StatTile label="Trades (90 days)" value={String(totalTrades)} />
            <StatTile
              label="Avg. vs S&P 500"
              value={formatPercent(avgReturn)}
              positive={avgReturn >= 0}
            />
            <StatTile
              label="Top performer"
              value={topPerformer?.name.split(" ").pop() ?? "—"}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        {trending.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Popular stocks this month
            </p>
            <TrendingTickerStrip tickers={trending} />
          </div>
        )}
      </div>

      <div className="mb-8">
        <MarketPulse pulse={pulse} />
      </div>

      <div className="mb-8 grid gap-8 xl:grid-cols-2">
        <HighConvictionFeed trades={highConviction} />
        <TradeClustersPanel clusters={clusters} />
      </div>

      <TrumpSpotlight />

      <div className="my-8">
        <TrendingTickers tickers={trending} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <LeaderboardPanel entries={entries} source={source} />
        <LiveTradeFeed
          trades={recentTrades.slice(0, 80)}
          showFilters={false}
          title="Latest trades"
          description="The most recent stock disclosures from Congress."
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  positive,
  className,
}: {
  label: string;
  value: string;
  positive?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("bg-card px-4 py-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          positive === undefined
            ? "text-foreground"
            : positive
              ? "text-gain"
              : "text-loss"
        )}
      >
        {value}
      </p>
    </div>
  );
}
