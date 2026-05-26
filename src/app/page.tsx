import { LeaderboardPanel } from "@/components/leaderboard/leaderboard-panel";
import { getLeaderboardData } from "@/lib/leaderboard";
import { formatPercent } from "@/lib/utils";

export default async function HomePage() {
  const { entries, source } = await getLeaderboardData();

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-terminal-amber">
              Capitol Trades Terminal
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Congressional Trading Leaderboard
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Real-time rankings of U.S. lawmakers by estimated portfolio
              performance relative to the S&amp;P 500, based on STOCK Act
              disclosures.
            </p>
          </div>

          <div className="terminal-ticker flex flex-wrap gap-px overflow-hidden rounded-md border border-border/60 bg-border/40">
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
      </div>

      <LeaderboardPanel entries={entries} source={source} />
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
    <div className="min-w-[120px] flex-1 bg-background/80 px-4 py-3">
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
