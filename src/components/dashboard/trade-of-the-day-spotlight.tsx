import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  LineChart,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { FollowTickerButton } from "@/components/shared/follow-ticker-button";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeOfTheDay } from "@/lib/trade-of-the-day";
import { cn, formatDate, formatPercent, formatRelativeTime } from "@/lib/utils";

interface TradeOfTheDaySpotlightProps {
  pick: TradeOfTheDay;
}

const actionStyles = {
  "research-buy": {
    badge: "border-gain/30 bg-gain/10 text-gain",
    glow: "from-gain/20 via-primary/10 to-transparent",
    primaryVariant: "default" as const,
  },
  "review-sell": {
    badge: "border-loss/30 bg-loss/10 text-loss",
    glow: "from-loss/15 via-primary/10 to-transparent",
    primaryVariant: "default" as const,
  },
  watch: {
    badge: "border-primary/30 bg-primary/10 text-primary",
    glow: "from-primary/15 via-primary/5 to-transparent",
    primaryVariant: "default" as const,
  },
};

export function TradeOfTheDaySpotlight({ pick }: TradeOfTheDaySpotlightProps) {
  const { trade, action, actionLabel, actionHeadline, actionSummary, cluster } =
    pick;
  const styles = actionStyles[action];
  const isPurchase = trade.type === "Purchase";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          styles.glow
        )}
      />
      <div className="relative border-b border-border/80 px-5 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 bg-primary/10 text-[10px] text-primary"
            >
              <Target className="h-3 w-3" />
              Trade of the day
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(pick.pickDate)} · Refreshes daily
            </span>
            <Badge variant="outline" className={cn("text-[10px]", styles.badge)}>
              {action === "research-buy"
                ? "Buy-side signal"
                : action === "review-sell"
                  ? "Sell-side signal"
                  : "Watchlist idea"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Research only — not investment advice
          </p>
        </div>
      </div>

      <div className="relative grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <Link
                href={`/ticker/${trade.ticker}`}
                className="ticker-symbol text-4xl sm:text-5xl hover:text-primary"
              >
                {trade.ticker}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {trade.company}
                {trade.sector ? ` · ${trade.sector}` : ""}
              </p>
            </div>
            <Badge
              variant={isPurchase ? "gain" : "loss"}
              className="mt-2 text-xs"
            >
              {isPurchase ? (
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="mr-1 h-3.5 w-3.5" />
              )}
              {trade.type}
            </Badge>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
              {actionHeadline}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {actionSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={`/politician/${trade.politicianId}`}
              className="font-medium hover:text-primary"
            >
              {trade.politicianName}
            </Link>
            <PartyBadge party={trade.party} className="px-1.5 py-0 text-[10px]" />
            <span className="text-muted-foreground">{trade.amount}</span>
            <span className="text-muted-foreground">
              · Filed {formatRelativeTime(trade.filingDate ?? trade.tradeDate)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {trade.significanceReasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] text-muted-foreground"
              >
                {reason}
              </span>
            ))}
            {cluster && cluster.politicianCount >= 2 && (
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] text-muted-foreground">
                {cluster.politicianCount} members on {trade.ticker}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" variant={styles.primaryVariant}>
              <Link href={`/ticker/${trade.ticker}`}>
                {actionLabel}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/politician/${trade.politicianId}`}>
                <LineChart className="mr-2 h-4 w-4" />
                Full filing intel
              </Link>
            </Button>
            <FollowTickerButton ticker={trade.ticker} size="lg" />
            <Button asChild size="lg" variant="outline">
              <Link href="/portfolio">
                <Wallet className="mr-2 h-4 w-4" />
                Compare to portfolio
              </Link>
            </Button>
          </div>
        </div>

        <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <SpotlightMetric
            label="Signal score"
            value={`${trade.significanceScore}/100`}
            highlight
          />
          <SpotlightMetric
            label="Since trade vs S&P"
            value={
              trade.excessReturn != null
                ? formatPercent(trade.excessReturn)
                : "—"
            }
            positive={
              trade.excessReturn != null ? trade.excessReturn >= 0 : undefined
            }
          />
          <SpotlightMetric
            label="Trader track record"
            value={
              trade.politicianReturnVsSpy != null
                ? formatPercent(trade.politicianReturnVsSpy)
                : "—"
            }
            positive={
              trade.politicianReturnVsSpy != null
                ? trade.politicianReturnVsSpy >= 0
                : undefined
            }
          />
          <SpotlightMetric
            label="Your next step"
            value={
              action === "research-buy"
                ? "Open ticker → set alert"
                : action === "review-sell"
                  ? "Check holdings → read filings"
                  : "Add to watchlist"
            }
            icon={Bell}
          />
        </aside>
      </div>
    </section>
  );
}

function SpotlightMetric({
  label,
  value,
  highlight,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
  icon?: typeof Bell;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/50 p-4">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <p
          className={cn(
            "text-lg font-semibold tabular-nums leading-tight",
            highlight && "text-primary",
            positive === true && "text-gain",
            positive === false && "text-loss"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
