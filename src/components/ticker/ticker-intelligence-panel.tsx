import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Scale,
  Users,
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
import { TickerIntelligence } from "@/lib/ticker-intelligence";
import { cn, formatPercent } from "@/lib/utils";

interface TickerIntelligencePanelProps {
  intelligence: TickerIntelligence;
}

export function TickerIntelligencePanel({
  intelligence,
}: TickerIntelligencePanelProps) {
  const buyPercent = Math.round(intelligence.buyRatio * 100);

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card">
        <CardHeader className="border-b border-border/80">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              Intelligence brief
            </Badge>
            {intelligence.cluster && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Users className="h-3 w-3" />
                #{intelligence.clusterRank} cluster ·{" "}
                {intelligence.cluster.politicianCount} members
              </Badge>
            )}
            <Badge
              variant={
                intelligence.netFlow === "buying"
                  ? "gain"
                  : intelligence.netFlow === "selling"
                    ? "loss"
                    : "secondary"
              }
              className="text-[10px] capitalize"
            >
              {intelligence.netFlow}
            </Badge>
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            {intelligence.headline}
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-relaxed sm:text-base">
            {intelligence.investorTake}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <IntelStat
            label="Avg vs S&P (since filing)"
            value={
              intelligence.avgExcessReturn != null
                ? formatPercent(intelligence.avgExcessReturn)
                : "—"
            }
            positive={
              intelligence.avgExcessReturn != null
                ? intelligence.avgExcessReturn >= 0
                : undefined
            }
          />
          <IntelStat
            label="Win rate vs S&P"
            value={
              intelligence.winRate != null
                ? `${Math.round(intelligence.winRate * 100)}%`
                : "—"
            }
          />
          <IntelStat
            label="Avg disclosure lag"
            value={
              intelligence.avgDisclosureLag != null
                ? `${intelligence.avgDisclosureLag}d`
                : "—"
            }
            warning={
              intelligence.slowDisclosureCount > 0
                ? `${intelligence.slowDisclosureCount} slow (>45d)`
                : undefined
            }
          />
          <IntelStat
            label="Activity (90d)"
            value={String(intelligence.recent90dCount)}
            sub={`${intelligence.politicianCount} members total`}
          />
        </CardContent>
        <div className="border-t border-border/80 px-5 py-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{intelligence.purchases} buys</span>
            <span>{intelligence.sales} sells</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
            <div className="bg-gain" style={{ width: `${buyPercent}%` }} />
            <div
              className="bg-loss"
              style={{ width: `${100 - buyPercent}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {intelligence.topScoredTrades.length > 0 && (
          <Card className="surface-card overflow-hidden">
            <CardHeader className="surface-header border-b border-border">
              <CardTitle className="text-base">Highest-signal trades</CardTitle>
              <CardDescription>
                Ranked by size, timing, returns, and crowd overlap on this
                ticker.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {intelligence.topScoredTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/politician/${trade.politicianId}`}
                        className="font-medium hover:text-primary"
                      >
                        {trade.politicianName}
                      </Link>
                      <Badge
                        variant={trade.type === "Purchase" ? "gain" : "loss"}
                        className="text-[10px]"
                      >
                        {trade.type}
                      </Badge>
                      <TradeSignificanceBadge
                        tier={trade.significanceTier}
                        score={trade.significanceScore}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trade.amount}
                      {trade.excessReturn != null &&
                        ` · ${formatPercent(trade.excessReturn)} vs S&P`}
                    </p>
                  </div>
                  <Link
                    href={`/politician/${trade.politicianId}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Profile
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="surface-card overflow-hidden">
          <CardHeader className="surface-header border-b border-border">
            <CardTitle className="text-base">Member breakdown</CardTitle>
            <CardDescription>
              Who traded {intelligence.ticker} and how each member positioned.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {intelligence.members.map((member) => (
              <div
                key={member.politicianId}
                className="flex items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/politician/${member.politicianId}`}
                    className="font-medium hover:text-primary"
                  >
                    {member.politicianName}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <PartyBadge
                      party={member.party}
                      className="px-1.5 py-0 text-[10px]"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {member.purchaseCount}B · {member.saleCount}S
                    </span>
                    {member.committee && (
                      <span className="text-[11px] text-muted-foreground">
                        · {member.committee}
                      </span>
                    )}
                  </div>
                </div>
                {member.avgExcessReturn != null && (
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      member.avgExcessReturn >= 0 ? "text-gain" : "text-loss"
                    )}
                  >
                    {formatPercent(member.avgExcessReturn)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {intelligence.committeeFlags.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Committee overlap flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {intelligence.committeeFlags.map((flag) => (
              <p key={flag.sector} className="text-sm text-muted-foreground">
                {flag.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function IntelStat({
  label,
  value,
  sub,
  positive,
  warning,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  warning?: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/50 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          positive === true && "text-gain",
          positive === false && "text-loss"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      {warning && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          {warning}
        </p>
      )}
    </div>
  );
}
