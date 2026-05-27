import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";

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
import { ScoredTrade } from "@/lib/trade-significance";
import { formatRelativeTime } from "@/lib/utils";

interface HighConvictionFeedProps {
  trades: ScoredTrade[];
}

export function HighConvictionFeed({ trades }: HighConvictionFeedProps) {
  if (trades.length === 0) {
    return null;
  }

  return (
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <CardTitle className="text-lg font-semibold">
          High-conviction trades
        </CardTitle>
        <CardDescription className="max-w-2xl leading-relaxed">
          Trades ranked by size, recency, post-trade performance, disclosure
          speed, and whether multiple members are active in the same stock —
          addressing the &ldquo;everything looks the same&rdquo; problem on raw
          disclosure feeds.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {trades.map((trade) => (
          <article
            key={trade.id}
            className="flex flex-col gap-3 p-5 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/ticker/${trade.ticker}`}
                  className="ticker-symbol text-lg hover:text-primary"
                >
                  {trade.ticker}
                </Link>
                <Badge
                  variant={trade.type === "Purchase" ? "gain" : "loss"}
                >
                  {trade.type}
                </Badge>
                <TradeSignificanceBadge
                  tier={trade.significanceTier}
                  score={trade.significanceScore}
                />
              </div>

              <p className="text-sm">
                <Link
                  href={`/politician/${trade.politicianId}`}
                  className="font-medium hover:text-primary"
                >
                  {trade.politicianName}
                </Link>{" "}
                · {trade.amount}
              </p>

              {trade.significanceReasons.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {trade.significanceReasons.join(" · ")}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <PartyBadge party={trade.party} />
                <Badge variant="outline" className="text-[10px]">
                  {trade.chamber}
                </Badge>
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="text-sm font-medium">
                Filed{" "}
                {formatRelativeTime(trade.filingDate ?? trade.tradeDate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Trade {formatRelativeTime(trade.tradeDate)}
              </p>
              <Link
                href={`/politician/${trade.politicianId}`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View profile
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
