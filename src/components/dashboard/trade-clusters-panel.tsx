import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TradeCluster } from "@/lib/trade-clusters";
import { formatRelativeTime } from "@/lib/utils";

interface TradeClustersPanelProps {
  clusters: TradeCluster[];
}

export function TradeClustersPanel({ clusters }: TradeClustersPanelProps) {
  if (clusters.length === 0) {
    return null;
  }

  return (
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <CardTitle className="text-lg font-semibold">
          Cluster activity
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Stocks where multiple members of Congress traded within the last 30
          days — a pattern retail investors watch for on Quiver and Capitol
          Trades.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
        {clusters.map((cluster) => (
          <Link
            key={cluster.ticker}
            href={`/ticker/${cluster.ticker}`}
            className="group rounded-lg border border-border bg-secondary/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ticker-symbol text-lg">
                    {cluster.ticker}
                  </span>
                  <Badge
                    variant={
                      cluster.netFlow === "buying"
                        ? "gain"
                        : cluster.netFlow === "selling"
                          ? "loss"
                          : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {cluster.netFlow}
                  </Badge>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {cluster.politicianCount} members · {cluster.tradeCount}{" "}
                  trades
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {cluster.politicians.slice(0, 3).join(", ")}
              {cluster.politicians.length > 3
                ? ` +${cluster.politicians.length - 3} more`
                : ""}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last activity {formatRelativeTime(cluster.lastTradeDate)}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
