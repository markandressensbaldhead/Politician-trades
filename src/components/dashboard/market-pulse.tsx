import Link from "next/link";
import { Activity, Clock, Flame, TrendingUp, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MarketPulse as MarketPulseStats } from "@/lib/trade-analytics";
import { MarketPulse as MarketPulseStats } from "@/lib/trade-analytics";

interface MarketPulseProps {
  pulse: MarketPulseStats;
}

export function MarketPulse({ pulse }: MarketPulseProps) {
  const stats = [
    {
      icon: Activity,
      label: "Trades (90D)",
      value: String(pulse.totalTrades90d),
    },
    {
      icon: Users,
      label: "Active Members",
      value: String(pulse.activePoliticians90d),
    },
    {
      icon: Clock,
      label: "Avg Disclosure Lag",
      value:
        pulse.avgDisclosureLagDays != null
          ? `${pulse.avgDisclosureLagDays} days`
          : "—",
    },
    {
      icon: TrendingUp,
      label: "Buy Ratio (90D)",
      value: `${Math.round(pulse.purchaseRatio * 100)}% buys`,
    },
  ];

  return (
    <Card className="overflow-hidden border-border/60 bg-card/40">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-terminal-amber" />
          Market Pulse
        </CardTitle>
        <CardDescription>
          Transparency metrics competitors rarely surface — disclosure speed and
          congressional flow in one view.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-md border border-border/60 bg-background/40 p-3"
          >
            <div className="flex items-center gap-2 text-terminal-amber">
              <Icon className="h-3.5 w-3.5" />
              <p className="font-mono text-[10px] uppercase tracking-wider">
                {label}
              </p>
            </div>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </CardContent>
      {(pulse.hottestTicker || pulse.slowDisclosureCount > 0) && (
        <div className="border-t border-border/60 bg-background/20 px-4 py-3 text-sm text-muted-foreground">
          {pulse.hottestTicker && (
            <p>
              Hottest ticker:{" "}
              <Link
                href={`/ticker/${pulse.hottestTicker.ticker}`}
                className="font-mono font-semibold text-terminal-amber hover:underline"
              >
                {pulse.hottestTicker.ticker}
              </Link>{" "}
              · {pulse.hottestTicker.tradeCount} trades ·{" "}
              {pulse.hottestTicker.politicianCount} politicians
            </p>
          )}
          {pulse.slowDisclosureCount > 0 && (
            <p className="mt-1">
              {pulse.slowDisclosureCount} trade
              {pulse.slowDisclosureCount !== 1 ? "s" : ""} disclosed after 45+
              days (STOCK Act allows up to 45; slower is a red flag).
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
