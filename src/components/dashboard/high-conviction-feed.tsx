import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Landmark,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { TradeSignificanceBadge } from "@/components/shared/trade-significance-badge";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Badge } from "@/components/ui/badge";
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
import { cn, formatDate, formatPercent, formatRelativeTime } from "@/lib/utils";

interface HighConvictionFeedProps {
  trades: ScoredTrade[];
}

const tierStyles = {
  high: "border-gain/30 bg-gain/10 text-gain",
  medium: "border-primary/30 bg-primary/10 text-primary",
  low: "border-border bg-secondary text-muted-foreground",
};

export function HighConvictionFeed({ trades }: HighConvictionFeedProps) {
  const summary = summarizeHighConviction(trades);

  if (trades.length === 0) {
    return (
      <Card className="surface-card overflow-hidden">
        <CardHeader className="surface-header border-b border-border">
          <CardTitle className="text-lg font-semibold">
            Trades worth watching
          </CardTitle>
          <CardDescription className="leading-relaxed">
            We rank disclosures by size, timing, post-trade performance,
            disclosure speed, and whether other members are trading the same
            stock — so the highest-signal moves rise above the noise.
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-semibold">
              Trades worth watching
            </CardTitle>
            <CardDescription className="max-w-xl leading-relaxed">
              Ranked by a composite signal score — not just filing date. Each
              card shows why a trade stands out and how it compares to the
              market.
            </CardDescription>
          </div>
          <SummaryStrip summary={summary} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-5">
        {trades.map((trade) => (
          <ConvictionCard key={trade.id} trade={trade} />
        ))}
      </CardContent>
    </Card>
  );
}

function SummaryStrip({ summary }: { summary: HighConvictionSummary }) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {summary.highCount > 0 && (
        <Badge variant="outline" className={cn("text-[10px]", tierStyles.high)}>
          {summary.highCount} high signal
        </Badge>
      )}
      {summary.mediumCount > 0 && (
        <Badge
          variant="outline"
          className={cn("text-[10px]", tierStyles.medium)}
        >
          {summary.mediumCount} notable
        </Badge>
      )}
      <Badge variant="outline" className="text-[10px]">
        Avg score {summary.avgScore}
      </Badge>
      <Badge variant="outline" className="gap-1 text-[10px]">
        {summary.purchaseCount} buys · {summary.saleCount} sells
      </Badge>
    </div>
  );
}

function ConvictionCard({ trade }: { trade: ScoredTrade }) {
  const activeFactors = trade.signalFactors.filter((factor) => factor.points > 0);
  const topFactorTotal = activeFactors.reduce(
    (sum, factor) => sum + factor.maxPoints,
    0
  );

  return (
    <article className="rounded-xl border border-border bg-secondary/15 p-4 transition-colors hover:border-primary/25 hover:bg-primary/[0.03]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/ticker/${trade.ticker}`}
              className="ticker-symbol text-xl hover:text-primary"
            >
              {trade.ticker}
            </Link>
            <Badge
              variant={trade.type === "Purchase" ? "gain" : "loss"}
              className="text-[10px]"
            >
              {trade.type === "Purchase" && (
                <TrendingUp className="mr-1 h-3 w-3" />
              )}
              {trade.type === "Sale" && (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {trade.type}
            </Badge>
            <TradeSignificanceBadge
              tier={trade.significanceTier}
              score={trade.significanceScore}
            />
            {trade.clusterPoliticianCount >= 2 && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Users className="h-3 w-3" />
                {trade.clusterPoliticianCount} on name
              </Badge>
            )}
            {trade.disclosureLag != null && trade.disclosureLag > 45 && (
              <Badge variant="outline" className="gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                {trade.disclosureLag}d lag
              </Badge>
            )}
          </div>

          <div>
            <p className="text-sm font-medium leading-snug">{trade.headline}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {trade.company}
              {trade.sector ? ` · ${trade.sector}` : ""}
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
          </div>

          {trade.significanceReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {trade.significanceReasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-full border border-border bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {activeFactors.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">
                Signal breakdown
              </p>
              <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                {activeFactors.map((factor) => (
                  <div
                    key={factor.id}
                    className={cn(
                      "transition-all",
                      factor.id === "returns" && trade.excessReturn != null && trade.excessReturn < 0
                        ? "bg-loss"
                        : factor.id === "cluster"
                          ? "bg-primary"
                          : factor.id === "disclosure" &&
                              trade.disclosureLag != null &&
                              trade.disclosureLag > 45
                            ? "bg-amber-500"
                            : "bg-gain"
                    )}
                    style={{
                      width: `${Math.max(
                        8,
                        (factor.points / Math.max(topFactorTotal, 1)) * 100
                      )}%`,
                    }}
                    title={`${factor.label}: +${factor.points}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFactors.slice(0, 4).map((factor) => (
                  <span
                    key={factor.id}
                    className="text-[10px] tabular-nums text-muted-foreground"
                  >
                    {factor.label}{" "}
                    <span className="font-medium text-foreground">
                      +{factor.points}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 lg:w-[220px]">
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Performance
            </p>
            {trade.excessReturn != null ? (
              <p
                className={cn(
                  "mt-1 text-2xl font-semibold tabular-nums",
                  trade.excessReturn >= 0 ? "text-gain" : "text-loss"
                )}
              >
                {formatPercent(trade.excessReturn)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Not tracked</p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              vs S&amp;P 500 since trade
            </p>

            <div className="mt-4 space-y-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Trade date</span>
                <span className="text-foreground">
                  {formatRelativeTime(trade.tradeDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Filed</span>
                <span className="text-foreground">
                  {formatRelativeTime(trade.filingDate ?? trade.tradeDate)}
                </span>
              </div>
              {trade.disclosureLag != null && (
                <div className="flex items-center justify-between gap-2">
                  <span>Disclosure lag</span>
                  <span
                    className={cn(
                      trade.disclosureLag > 45
                        ? "text-amber-600 dark:text-amber-400"
                        : trade.disclosureLag <= 10
                          ? "text-gain"
                          : "text-foreground"
                    )}
                  >
                    {trade.disclosureLag} days
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link
              href={`/ticker/${trade.ticker}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {trade.ticker} activity
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link
              href={`/politician/${trade.politicianId}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {trade.politicianName.split(" ").pop()}&apos;s profile
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Traded {formatDate(trade.tradeDate)}
        {trade.filingDate && trade.filingDate !== trade.tradeDate
          ? ` · Filed ${formatDate(trade.filingDate)}`
          : ""}
        {trade.clusterPoliticianCount >= 2 ? (
          <>
            {" "}
            · <Scale className="mr-0.5 inline h-3 w-3" />
            Cluster overlap
          </>
        ) : null}
        {trade.amountTier === "mega" ? (
          <>
            {" "}
            · <Zap className="mr-0.5 inline h-3 w-3" />
            Top-tier size
          </>
        ) : null}
      </p>
    </article>
  );
}
