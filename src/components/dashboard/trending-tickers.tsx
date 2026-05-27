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
import { cn, formatDate } from "@/lib/utils";

interface TrendingTickersProps {
  tickers: TrendingTicker[];
  title?: string;
  description?: string;
}

export function TrendingTickers({
  tickers,
  title = "Trending Tickers",
  description = "Most-traded stocks across Congress in the last 90 days — the question everyone asks first.",
}: TrendingTickersProps) {
  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tickers.slice(0, 9).map((entry, index) => (
          <Link
            key={entry.ticker}
            href={`/ticker/${entry.ticker}`}
            className="group rounded-md border border-border/60 bg-background/30 p-3 transition-colors hover:border-terminal-amber/40 hover:bg-terminal-amber/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="font-mono text-lg font-bold">
                    {entry.ticker}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.tradeCount} trades · {entry.politicianCount} members
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-terminal-amber" />
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
                className="font-mono text-[10px]"
              >
                {entry.netFlow === "buying" && (
                  <TrendingUp className="mr-1 h-3 w-3" />
                )}
                {entry.netFlow === "selling" && (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {entry.netFlow}
              </Badge>
              <span className="font-mono text-[10px] text-muted-foreground">
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
            "shrink-0 rounded-md border border-border/60 bg-background/50 px-3 py-2 transition-colors hover:border-terminal-amber/40",
            entry.netFlow === "buying" && "border-gain/20",
            entry.netFlow === "selling" && "border-loss/20"
          )}
        >
          <span className="font-mono text-sm font-bold">{entry.ticker}</span>
          <span className="ml-2 font-mono text-[10px] text-muted-foreground">
            {entry.tradeCount} trades
          </span>
        </Link>
      ))}
    </div>
  );
}
