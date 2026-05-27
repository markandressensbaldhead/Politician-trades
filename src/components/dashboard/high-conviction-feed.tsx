import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Landmark,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { TradeSignificanceBadge } from "@/components/shared/trade-significance-badge";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HighConvictionSummary,
  ScoredTrade,
  summarizeHighConviction,
} from "@/lib/trade-significance";
import { cn, formatPercent, formatRelativeTime } from "@/lib/utils";

interface HighConvictionFeedProps {
  trades: ScoredTrade[];
}

const tagStyles: Record<string, string> = {
  "Congress cluster": "border-gain/30 bg-gain/10 text-gain",
  "Whale disclosure": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Committee overlap": "border-primary/30 bg-primary/10 text-primary",
  "Beating market": "border-gain/30 bg-gain/10 text-gain",
  "Top trader": "border-primary/30 bg-primary/10 text-primary",
  "Fresh filing": "border-border bg-secondary text-foreground",
};

export function HighConvictionFeed({ trades }: HighConvictionFeedProps) {
  const summary = summarizeHighConviction(trades);
  const [featured, ...rest] = trades;

  if (trades.length === 0) {
    return (
      <Card className="surface-card overflow-hidden">
        <CardHeader className="surface-header border-b border-border">
          <CardTitle className="text-lg font-semibold">
            High-conviction trades
          </CardTitle>
          <CardDescription className="leading-relaxed">
            The disclosures most likely to matter — ranked by size, cluster
            overlap, trader track record, committee context, and post-filing
            performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No elevated-signal trades in the last 90 days. As filings sync,
            standout moves will appear here automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-semibold">
              High-conviction trades
            </CardTitle>
            <CardDescription className="max-w-2xl leading-relaxed">
              Not every disclosure is equal. We surface the trades with the
              strongest combination of size, crowd overlap, committee context,
              and market follow-through — one pick per ticker so you see breadth,
              not duplicates.
            </CardDescription>
          </div>
          <SummaryStats summary={summary} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        {featured && <FeaturedTrade trade={featured} rank={1} />}

        {rest.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="hidden grid-cols-[2rem_minmax(0,1.4fr)_5rem_5rem_6rem] gap-3 border-b border-border bg-secondary/30 px-4 py-2 text-[11px] font-medium text-muted-foreground md:grid">
              <span>#</span>
              <span>Trade</span>
              <span className="text-right">Score</span>
              <span className="text-right">vs S&P</span>
              <span className="text-right">Filed</span>
            </div>
            <div className="divide-y divide-border">
              {rest.map((trade, index) => (
                <RankedTradeRow key={trade.id} trade={trade} rank={index + 2} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Scores combine trade size, recency, cluster overlap, committee fit,
            trader history, and vs-S&amp;P performance when available.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/feed">
              Browse all trades
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStats({ summary }: { summary: HighConvictionSummary }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[320px]">
      <StatPill label="Top score" value={String(summary.topScore)} highlight />
      <StatPill label="Avg score" value={String(summary.avgScore)} />
      <StatPill
        label="Avg vs S&P"
        value={
          summary.avgReturn != null ? formatPercent(summary.avgReturn) : "—"
        }
        positive={summary.avgReturn != null ? summary.avgReturn >= 0 : undefined}
      />
      <StatPill
        label="Flow"
        value={`${summary.purchaseCount}B / ${summary.saleCount}S`}
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums",
          highlight && "text-primary",
          positive === true && "text-gain",
          positive === false && "text-loss"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ScoreRing({
  score,
  tier,
  size = "md",
}: {
  score: number;
  tier: ScoredTrade["significanceTier"];
  size?: "md" | "sm";
}) {
  const radius = size === "md" ? 30 : 22;
  const stroke = size === "md" ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dimension = size === "md" ? 72 : 52;

  return (
    <div
      className="relative shrink-0"
      style={{ width: dimension, height: dimension }}
    >
      <svg
        className="-rotate-90"
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-secondary"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            tier === "high"
              ? "text-gain"
              : tier === "medium"
                ? "text-primary"
                : "text-muted-foreground"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold tabular-nums leading-none">
          {score}
        </span>
        <span className="mt-0.5 text-[9px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function SignalTag({ tag }: { tag: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] font-medium",
        tagStyles[tag] ?? "border-border bg-secondary text-muted-foreground"
      )}
    >
      <Sparkles className="h-3 w-3" />
      {tag}
    </Badge>
  );
}

function FeaturedTrade({ trade, rank }: { trade: ScoredTrade; rank: number }) {
  const topFactors = trade.signalFactors.slice(0, 3);

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-background p-5">
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          #{rank} top signal
        </Badge>
        <SignalTag tag={trade.signalTag} />
        {trade.clusterPoliticianCount >= 2 && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Users className="h-3 w-3" />
            {trade.clusterPoliticianCount} members
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <ScoreRing score={trade.significanceScore} tier={trade.significanceTier} />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/ticker/${trade.ticker}`}
              className="ticker-symbol text-2xl hover:text-primary"
            >
              {trade.ticker}
            </Link>
            <Badge
              variant={trade.type === "Purchase" ? "gain" : "loss"}
              className="text-[10px]"
            >
              {trade.type === "Purchase" ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {trade.type}
            </Badge>
            <TradeSignificanceBadge
              tier={trade.significanceTier}
              score={trade.significanceScore}
            />
          </div>

          <div>
            <p className="text-base font-semibold leading-snug">{trade.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {trade.investorTake}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/politician/${trade.politicianId}`}
              className="text-sm font-medium hover:text-primary"
            >
              {trade.politicianName}
            </Link>
            <PartyBadge party={trade.party} className="px-1.5 py-0 text-[10px]" />
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Landmark className="h-3 w-3" />
              {trade.chamber}
            </Badge>
            <span className="text-xs text-muted-foreground">{trade.amount}</span>
            {trade.politicianReturnVsSpy != null && (
              <span className="text-xs text-muted-foreground">
                · Trader avg{" "}
                <span
                  className={
                    trade.politicianReturnVsSpy >= 0 ? "text-gain" : "text-loss"
                  }
                >
                  {formatPercent(trade.politicianReturnVsSpy)}
                </span>
              </span>
            )}
          </div>

          {topFactors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topFactors.map((factor) => (
                <span
                  key={factor.id}
                  className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10px] tabular-nums text-muted-foreground"
                >
                  {factor.label}{" "}
                  <span className="font-medium text-foreground">
                    +{factor.points}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid w-full shrink-0 grid-cols-3 gap-2 lg:w-[240px] lg:grid-cols-1">
          <MetricTile
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
          <MetricTile
            label="Filed"
            value={formatRelativeTime(trade.filingDate ?? trade.tradeDate)}
          />
          <MetricTile
            label="Disclosure lag"
            value={
              trade.disclosureLag != null ? `${trade.disclosureLag}d` : "—"
            }
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-border/80 pt-4">
        <Link
          href={`/ticker/${trade.ticker}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View {trade.ticker} congressional activity
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/politician/${trade.politicianId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          {trade.politicianName.split(" ").pop()}&apos;s full profile
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold tabular-nums",
          positive === true && "text-gain",
          positive === false && "text-loss"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function RankedTradeRow({ trade, rank }: { trade: ScoredTrade; rank: number }) {
  return (
    <Link
      href={`/ticker/${trade.ticker}`}
      className="group grid grid-cols-1 gap-3 px-4 py-3 transition-colors hover:bg-secondary/20 md:grid-cols-[2rem_minmax(0,1.4fr)_5rem_5rem_6rem] md:items-center md:gap-3"
    >
      <span className="hidden text-xs font-medium tabular-nums text-muted-foreground md:block">
        {rank}
      </span>

      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium tabular-nums text-muted-foreground md:hidden">
            #{rank}
          </span>
          <span className="ticker-symbol text-base group-hover:text-primary">
            {trade.ticker}
          </span>
          <Badge
            variant={trade.type === "Purchase" ? "gain" : "loss"}
            className="text-[10px]"
          >
            {trade.type}
          </Badge>
          <SignalTag tag={trade.signalTag} />
        </div>
        <p className="text-sm font-medium leading-snug">{trade.headline}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {trade.investorTake}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {trade.politicianName}
          </span>
          <PartyBadge party={trade.party} className="px-1.5 py-0 text-[10px]" />
          <span>{trade.amount}</span>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="flex justify-end">
          <ScoreRing
            score={trade.significanceScore}
            tier={trade.significanceTier}
            size="sm"
          />
        </div>
      </div>

      <div className="hidden text-right md:block">
        {trade.excessReturn != null ? (
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              trade.excessReturn >= 0 ? "text-gain" : "text-loss"
            )}
          >
            {formatPercent(trade.excessReturn)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
        <p className="mt-0.5 text-[10px] text-muted-foreground md:hidden">
          Score {trade.significanceScore}
        </p>
      </div>

      <div className="hidden text-right text-xs text-muted-foreground md:block">
        {formatRelativeTime(trade.filingDate ?? trade.tradeDate)}
      </div>

      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <ScoreRing
            score={trade.significanceScore}
            tier={trade.significanceTier}
            size="sm"
          />
          {trade.excessReturn != null && (
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                trade.excessReturn >= 0 ? "text-gain" : "text-loss"
              )}
            >
              {formatPercent(trade.excessReturn)}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(trade.filingDate ?? trade.tradeDate)}
        </span>
      </div>
    </Link>
  );
}
