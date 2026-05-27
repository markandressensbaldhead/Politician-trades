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
import { ShareOnXButton } from "@/components/shared/share-on-x-button";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildTradeOfDayTweet, SITE_URL } from "@/lib/share";
import { COPY } from "@/lib/brand";
import { TradeOfTheDay } from "@/lib/trade-of-the-day";
import { cn, formatDate, formatPercent, formatRelativeTime } from "@/lib/utils";

interface TradeOfTheDaySpotlightProps {
  pick: TradeOfTheDay;
}

const actionStyles = {
  "research-buy": {
    badge: "border-gain/30 bg-gain/10 text-gain",
    glow: "from-gain/25 via-primary/10 to-transparent",
  },
  "review-sell": {
    badge: "border-loss/30 bg-loss/10 text-loss",
    glow: "from-loss/20 via-primary/10 to-transparent",
  },
  watch: {
    badge: "border-primary/30 bg-primary/10 text-primary",
    glow: "from-primary/15 via-primary/5 to-transparent",
  },
};

export function TradeOfTheDaySpotlight({ pick }: TradeOfTheDaySpotlightProps) {
  const { trade, action, actionLabel, actionHeadline, actionSummary, cluster } =
    pick;
  const styles = actionStyles[action];
  const isPurchase = trade.type === "Purchase";
  const shareText = buildTradeOfDayTweet(pick, SITE_URL);
  const tweetHook =
    trade.excessReturn != null
      ? `${formatPercent(trade.excessReturn)} vs S&P since filing`
      : `${trade.significanceScore}/100 signal score`;

  return (
    <section
      id="trade-of-day"
      className="scroll-mt-24 relative overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-lg shadow-primary/5"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
          styles.glow
        )}
      />
      <div className="relative border-b border-border/80 px-5 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <Target className="h-3 w-3" />
              Today&apos;s {COPY.hillPick}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(pick.pickDate)} · The one to share
            </span>
            <Badge variant="outline" className={cn("text-[10px]", styles.badge)}>
              {isPurchase ? "Deploy capital?" : "Reduce exposure?"}
            </Badge>
          </div>
          <ShareOnXButton
            text={shareText}
            url={SITE_URL}
            size="sm"
            label="Post this pick"
          />
        </div>
      </div>

      <div className="relative grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <Link
                href={`/ticker/${trade.ticker}`}
                className="ticker-symbol text-5xl sm:text-6xl hover:text-primary"
              >
                ${trade.ticker}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {trade.company}
              </p>
            </div>
            <Badge
              variant={isPurchase ? "gain" : "loss"}
              className="mt-3 text-xs"
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
            <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {actionHeadline}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {actionSummary}
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-sm">
            <Link
              href={`/politician/${trade.politicianId}`}
              className="font-semibold hover:text-primary"
            >
              {trade.politicianName}
            </Link>
            <PartyBadge party={trade.party} className="px-1.5 py-0 text-[10px]" />
            <span className="text-muted-foreground">{trade.amount}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium text-foreground">{tweetHook}</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link href={`/ticker/${trade.ticker}`}>
                {actionLabel}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12">
              <Link href={`/politician/${trade.politicianId}`}>
                <LineChart className="mr-2 h-4 w-4" />
                Who filed it
              </Link>
            </Button>
            <FollowTickerButton ticker={trade.ticker} size="lg" />
            <Button asChild size="lg" variant="outline" className="h-12">
              <Link href="/portfolio">
                <Wallet className="mr-2 h-4 w-4" />
                Do I own this?
              </Link>
            </Button>
          </div>
        </div>

        <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <SpotlightMetric
            label="Signal strength"
            value={`${trade.significanceScore}/100`}
            highlight
          />
          <SpotlightMetric
            label="Since trade vs S&P"
            value={
              trade.excessReturn != null
                ? formatPercent(trade.excessReturn)
                : "Tracking…"
            }
            positive={
              trade.excessReturn != null ? trade.excessReturn >= 0 : undefined
            }
          />
          {cluster && cluster.politicianCount >= 2 && (
            <SpotlightMetric
              label="Crowd overlap"
              value={`${cluster.politicianCount} members`}
              sub={`Net ${cluster.netFlow} on $${trade.ticker}`}
            />
          )}
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-primary">X post hook</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              &ldquo;{actionHeadline}. Free tracker — link in bio.&rdquo;
            </p>
            <ShareOnXButton
              text={shareText}
              url={SITE_URL}
              size="sm"
              className="mt-3 w-full sm:w-auto"
              label="Copy to X"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

function SpotlightMetric({
  label,
  value,
  sub,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/50 p-4">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold tabular-nums",
          highlight && "text-primary",
          positive === true && "text-gain",
          positive === false && "text-loss"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
