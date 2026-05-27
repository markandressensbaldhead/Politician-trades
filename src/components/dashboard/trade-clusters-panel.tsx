import Link from "next/link";
import {
  ArrowUpRight,
  Landmark,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

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
  SectorCluster,
  TradeCluster,
} from "@/lib/trade-clusters";
import { cn, formatDate, formatPercent, formatRelativeTime } from "@/lib/utils";

interface TradeClustersPanelProps {
  clusters: TradeCluster[];
  sectorClusters?: SectorCluster[];
}

const signalStyles = {
  strong: "border-gain/30 bg-gain/10 text-gain",
  notable: "border-primary/30 bg-primary/10 text-primary",
  watch: "border-border bg-secondary text-muted-foreground",
};

export function TradeClustersPanel({
  clusters,
  sectorClusters = [],
}: TradeClustersPanelProps) {
  const hasTickerClusters = clusters.length > 0;
  const hasSectorClusters = sectorClusters.length > 0;

  if (!hasTickerClusters && !hasSectorClusters) {
    return (
      <Card className="surface-card overflow-hidden">
        <CardHeader className="surface-header border-b border-border">
          <CardTitle className="text-lg font-semibold">
            When everyone&apos;s buying the same thing
          </CardTitle>
          <CardDescription className="leading-relaxed">
            Multiple lawmakers, one ticker — the crowd signal retail traders
            watch before deploying capital.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No multi-member clusters in the current window. As more trades sync,
            overlapping activity will appear here automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <CardTitle className="text-lg font-semibold">
          When everyone&apos;s buying the same thing
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Stocks where Capitol is piling in together — bipartisan overlap,
          recent bursts, and net buy pressure ranked for you.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        {hasTickerClusters ? (
          <div className="space-y-3">
            {clusters.map((cluster) => (
              <ClusterCard key={cluster.ticker} cluster={cluster} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No single-stock clusters yet — showing sector-level convergence
            instead.
          </p>
        )}

        {hasSectorClusters && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Sector momentum
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sectorClusters.map((sector) => (
                <SectorCard key={sector.sector} sector={sector} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClusterCard({ cluster }: { cluster: TradeCluster }) {
  const buyPercent = Math.round(cluster.buyRatio * 100);

  return (
    <div className="rounded-xl border border-border bg-secondary/15 p-4 transition-colors hover:border-primary/25 hover:bg-primary/[0.03]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/ticker/${cluster.ticker}`}
              className="ticker-symbol text-xl hover:text-primary"
            >
              {cluster.ticker}
            </Link>
            <Badge
              variant="outline"
              className={cn("text-[10px] font-medium", signalStyles[cluster.signal])}
            >
              {cluster.signal === "strong"
                ? "Strong signal"
                : cluster.signal === "notable"
                  ? "Notable"
                  : "Watch"}
            </Badge>
            <Badge
              variant={
                cluster.netFlow === "buying"
                  ? "gain"
                  : cluster.netFlow === "selling"
                    ? "loss"
                    : "secondary"
              }
              className="text-[10px] capitalize"
            >
              {cluster.netFlow === "buying" && (
                <TrendingUp className="mr-1 h-3 w-3" />
              )}
              {cluster.netFlow === "selling" && (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {cluster.netFlow}
            </Badge>
            {cluster.isBipartisan && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Scale className="h-3 w-3" />
                Bipartisan
              </Badge>
            )}
            {cluster.recentBurstCount >= 2 && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Zap className="h-3 w-3" />
                {cluster.recentBurstCount} in 14d
              </Badge>
            )}
          </div>

          <div>
            <p className="text-sm font-medium leading-snug">{cluster.headline}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {cluster.company}
              {cluster.sector ? ` · ${cluster.sector}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {cluster.politicianCount} members
            </span>
            <span>{cluster.tradeCount} trades</span>
            {cluster.senateCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Landmark className="h-3.5 w-3.5" />
                {cluster.senateCount} Senate · {cluster.houseCount} House
              </span>
            )}
            {cluster.democratCount > 0 && (
              <span>{cluster.democratCount}D · {cluster.republicanCount}R</span>
            )}
            {cluster.avgExcessReturn != null && (
              <span
                className={
                  cluster.avgExcessReturn >= 0 ? "text-gain" : "text-loss"
                }
              >
                Avg vs SPY {formatPercent(cluster.avgExcessReturn)}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{cluster.purchaseCount} buys</span>
              <span>{cluster.saleCount} sells</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="bg-gain transition-all"
                style={{ width: `${buyPercent}%` }}
              />
              <div
                className="bg-loss transition-all"
                style={{ width: `${100 - buyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[280px]">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Who traded it
          </p>
          <div className="divide-y divide-border rounded-lg border border-border bg-background/40">
            {cluster.members.slice(0, 4).map((member) => (
              <div
                key={`${member.politicianId}-${member.tradeDate}`}
                className="flex items-start justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/politician/${member.politicianId}`}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {member.politicianName}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <PartyBadge party={member.party} className="px-1.5 py-0 text-[10px]" />
                    <Badge
                      variant={member.type === "Purchase" ? "gain" : "loss"}
                      className="text-[10px]"
                    >
                      {member.type}
                    </Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                  <p className="tabular-nums">{member.amount}</p>
                  <p>{formatRelativeTime(member.tradeDate)}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`/ticker/${cluster.ticker}`}
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all {cluster.ticker} trades
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Active {formatDate(cluster.firstTradeDate)} –{" "}
        {formatRelativeTime(cluster.lastTradeDate)} · Signal score{" "}
        {cluster.signalScore}/100
      </p>
    </div>
  );
}

function SectorCard({ sector }: { sector: SectorCluster }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-sm font-medium">{sector.sector}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {sector.headline}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {sector.topTickers.map((ticker) => (
          <Link
            key={ticker}
            href={`/ticker/${ticker}`}
            className="rounded border border-border px-2 py-0.5 text-[11px] font-medium hover:border-primary/30 hover:text-primary"
          >
            {ticker}
          </Link>
        ))}
      </div>
    </div>
  );
}
