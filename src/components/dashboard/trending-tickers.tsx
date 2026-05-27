import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingTicker } from "@/lib/trade-analytics";
import { BRAND } from "@/lib/brand";
import { cn, formatDate } from "@/lib/utils";

interface TrendingTickersProps {
  tickers: TrendingTicker[];
  title?: string;
  description?: string;
  embedded?: boolean;
}

export function TrendingTickers({
  tickers,
  title = "Hot on the Hill",
  description = `Most-traded stocks on ${BRAND.hill} in the last 90 days — the question everyone asks first.`,
  embedded = false,
}: TrendingTickersProps) {
  return (
    <Card className={cn(!embedded && "border-border/60 bg-card/40")}>
      {!embedded && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", embedded && "p-0")}>
        {tickers.slice(0, 9).map((entry, index) => (
          <Link
            key={entry.ticker}
            href={`/ticker/${entry.ticker}`}
            className="group rounded-xl border border-border/70 bg-background/40 p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="ticker-symbol text-lg">{entry.ticker}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.tradeCount} trades · {entry.politicianCount} members
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  entry.netFlow === "buying"
                    ? "gain"
                    : entry.netFlow === "selling"
                      ? "loss"
                      : "secondary"
                }
                className="text-[10px]"
              >
                {entry.netFlow === "buying" && (
                  <TrendingUp className="mr-1 h-3 w-3" />
                )}
                {entry.netFlow === "selling" && (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {entry.netFlow}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Last {formatDate(entry.lastTradeDate)}
              </span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function TrendingTickerStrip({ tickers }: { tickers: TrendingTicker[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tickers.slice(0, 12).map((entry) => (
        <Link
          key={entry.ticker}
          href={`/ticker/${entry.ticker}`}
          className={cn(
            "shrink-0 rounded-lg border border-border bg-background/50 px-3 py-2 transition-colors hover:border-primary/30",
            entry.netFlow === "buying" && "border-gain/20",
            entry.netFlow === "selling" && "border-loss/20"
          )}
        >
          <span className="ticker-symbol text-sm">{entry.ticker}</span>
          <span className="ml-2 text-[10px] text-muted-foreground">
            {entry.tradeCount} trades
          </span>
        </Link>
      ))}
    </div>
  );
}
