import Link from "next/link";
import { Activity, Clock, TrendingUp, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MarketPulse as MarketPulseStats } from "@/lib/trade-analytics";

interface MarketPulseProps {
  pulse: MarketPulseStats;
}

export function MarketPulse({ pulse }: MarketPulseProps) {
  const stats = [
    {
      icon: Activity,
      label: "Trades (90 days)",
      value: String(pulse.totalTrades90d),
    },
    {
      icon: Users,
      label: "Active members",
      value: String(pulse.activePoliticians90d),
    },
    {
      icon: Clock,
      label: "Avg. reporting delay",
      value:
        pulse.avgDisclosureLagDays != null
          ? `${pulse.avgDisclosureLagDays} days`
          : "—",
    },
    {
      icon: TrendingUp,
      label: "Buy vs. sell",
      value: `${Math.round(pulse.purchaseRatio * 100)}% purchases`,
    },
  ];

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-semibold">At a glance</CardTitle>
        <CardDescription>
          A quick snapshot of congressional trading activity over the last 90
          days.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-secondary/30 p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <p className="text-xs font-medium">{label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </CardContent>
      {(pulse.hottestTicker || pulse.slowDisclosureCount > 0) && (
        <div className="border-t border-border bg-secondary/20 px-5 py-4 text-sm text-muted-foreground">
          {pulse.hottestTicker && (
            <p>
              Most traded stock:{" "}
              <Link
                href={`/ticker/${pulse.hottestTicker.ticker}`}
                className="font-semibold text-primary hover:underline"
              >
                {pulse.hottestTicker.ticker}
              </Link>{" "}
              · {pulse.hottestTicker.tradeCount} trades ·{" "}
              {pulse.hottestTicker.politicianCount} members
            </p>
          )}
          {pulse.slowDisclosureCount > 0 && (
            <p className="mt-1">
              {pulse.slowDisclosureCount} trade
              {pulse.slowDisclosureCount !== 1 ? "s were" : " was"} reported
              more than 45 days after the transaction.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
