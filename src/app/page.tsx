import { LeaderboardPanel } from "@/components/leaderboard/leaderboard-panel";
import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { MarketPulse } from "@/components/dashboard/market-pulse";
import { TrendingTickerStrip, TrendingTickers } from "@/components/dashboard/trending-tickers";
import { TrumpSpotlight } from "@/components/dashboard/trump-spotlight";
import {
  getAllTrades,
  getLeaderboardData,
  getRecentTrades,
} from "@/lib/congress-data";
import { getMarketPulse, getTrendingTickers } from "@/lib/trade-analytics";
import { formatPercent } from "@/lib/utils";

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
      ? "Locked DB"
      : source === "live"
        ? "Live"
        : "Demo";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-terminal-amber">
              Capitol Trades Terminal
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Who&apos;s beating the market — and what are they buying?
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Congressional trading intelligence with disclosure lag analytics,
              ticker-first discovery, and SEC filing cross-links — built for
              investors who want transparency competitors don&apos;t show.
            </p>
            {source === "mock" && (
              <p className="rounded-md border border-terminal-amber/30 bg-terminal-amber/5 px-3 py-2 text-sm text-terminal-amber">
                Demo mode — add{" "}
                <code className="font-mono text-xs">QUIVERQUANT_API_KEY</code>{" "}
                in Vercel to show live congressional trade data.
              </p>
            )}
          </div>

          <div className="terminal-ticker flex flex-wrap gap-px overflow-hidden rounded-md border border-border/60 bg-border/40">
            <TickerStat label="Data" value={dataLabel} />
            <TickerStat label="Tracked" value={String(entries.length)} />
            <TickerStat label="Trades 90D" value={String(totalTrades)} />
            <TickerStat
              label="Avg vs SPY"
              value={formatPercent(avgReturn)}
              positive={avgReturn >= 0}
            />
            <TickerStat
              label="Top"
              value={topPerformer?.name.split(" ").pop() ?? "—"}
              compact
            />
          </div>
        </div>

        {trending.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Trending tickers — tap to see who traded
            </p>
            <TrendingTickerStrip tickers={trending} />
          </div>
        )}
      </div>

      <div className="mb-6">
        <MarketPulse pulse={pulse} />
      </div>

      <TrumpSpotlight />

      <div className="my-6">
        <TrendingTickers tickers={trending} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <LeaderboardPanel entries={entries} source={source} />
        <LiveTradeFeed
          trades={recentTrades.slice(0, 80)}
          showFilters={false}
          title="Latest Activity"
          description="Newest disclosures across Congress."
        />
      </div>
    </div>
  );
}

function TickerStat({
  label,
  value,
  positive,
  compact,
}: {
  label: string;
  value: string;
  positive?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="min-w-[100px] flex-1 bg-background/80 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
        {label}
      </p>
      <p
        className={`mt-1 truncate font-mono text-sm font-semibold tabular-nums ${
          positive === undefined
            ? "text-foreground"
            : positive
              ? "text-gain"
              : "text-loss"
        } ${compact ? "text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
