import Link from "next/link";

import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { ExportCsvLink } from "@/components/shared/export-csv-button";
import { FollowTickerButton } from "@/components/shared/follow-ticker-button";
import { DisclosureLagBadge } from "@/components/shared/disclosure-lag-badge";
import { TradeSignificanceBadge } from "@/components/shared/trade-significance-badge";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { TickerIntelligencePanel } from "@/components/ticker/ticker-intelligence-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildPoliticianMetadataIndex } from "@/lib/politician-metadata";
import { buildClusterIndex, getTradeClusters } from "@/lib/trade-clusters";
import { scoreTrades } from "@/lib/trade-significance";
import { buildTickerIntelligence } from "@/lib/ticker-intelligence";
import { loadUnifiedTrades, toLegacyRecentTrade } from "@/lib/unified-trades";
import { cn, formatDate, formatPercent } from "@/lib/utils";

interface TickerPageProps {
  symbol: string;
}

export async function TickerPageContent({ symbol }: TickerPageProps) {
  const ticker = symbol.toUpperCase();
  const { trades: allTrades, source } = await loadUnifiedTrades();
  const trades = allTrades
    .filter((trade) => trade.ticker === ticker)
    .sort(
      (a, b) =>
        new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
    );

  const intelligence = buildTickerIntelligence(ticker, trades, allTrades);
  const clusters = getTradeClusters(allTrades, {
    days: 90,
    minPoliticians: 2,
    limit: 20,
  });
  const clusterIndex = buildClusterIndex(clusters);
  const politicianIndex = buildPoliticianMetadataIndex(allTrades);
  const scoredById = new Map(
    scoreTrades(trades, clusterIndex, politicianIndex).map((trade) => [
      trade.id,
      trade,
    ])
  );
  const recentLegacy = trades.slice(0, 100).map(toLegacyRecentTrade);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="page-eyebrow">Stock view</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Who in Congress traded{" "}
          <span className="ticker-symbol text-primary">{ticker}</span>?
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Intelligence brief, vs-S&P performance, crowd clusters, and every
          disclosed buy and sell — the view power users search for on QuiverQuant
          and Capitol Trades.
        </p>
        {source === "mock" && (
          <p className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2 text-sm text-muted-foreground">
            Demo data — add QUIVERQUANT_API_KEY for live congressional trades.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <ExportCsvLink
            href={`/api/export/trades?ticker=${encodeURIComponent(ticker)}`}
            label={`Export ${ticker} CSV`}
          />
          <FollowTickerButton ticker={ticker} />
        </div>
      </div>

      {trades.length === 0 ? (
        <Card className="border-border/60 bg-card/40">
          <CardContent className="py-12 text-center text-muted-foreground">
            No disclosed congressional trades found for {ticker} yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {intelligence && <TickerIntelligencePanel intelligence={intelligence} />}

          <Card className="border-border/60 bg-card/40">
            <CardHeader>
              <CardTitle>All {ticker} trades</CardTitle>
              <CardDescription>
                Significance scoring, disclosure lag, and post-filing vs-S&P
                where available.
              </CardDescription>
            </CardHeader>
            <CardContent className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Politician</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>vs S&P</TableHead>
                    <TableHead>Trade Date</TableHead>
                    <TableHead>Disclosure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.slice(0, 50).map((trade) => {
                    const scored = scoredById.get(trade.id);

                    return (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <Link
                            href={`/politician/${trade.politicianId}`}
                            className="font-medium hover:text-primary"
                          >
                            {trade.politicianName}
                          </Link>
                          <div className="mt-1 flex gap-1">
                            <PartyBadge party={trade.party} />
                            <Badge variant="outline" className="text-[10px]">
                              {trade.chamber}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              trade.type === "Purchase" ? "gain" : "loss"
                            }
                          >
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {scored ? (
                            <TradeSignificanceBadge
                              tier={scored.significanceTier}
                              score={scored.significanceScore}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {trade.amount}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-sm tabular-nums",
                            trade.excessReturn != null &&
                              (trade.excessReturn >= 0
                                ? "text-gain"
                                : "text-loss")
                          )}
                        >
                          {trade.excessReturn != null
                            ? formatPercent(trade.excessReturn)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(trade.tradeDate)}
                        </TableCell>
                        <TableCell>
                          <DisclosureLagBadge days={trade.disclosureLagDays} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <LiveTradeFeed
            trades={recentLegacy}
            title={`${ticker} Feed`}
            description={`Filter all ${ticker} congressional trades.`}
          />
        </>
      )}
    </div>
  );
}

export async function generateTickerStaticParams() {
  const { getTickerIndex } = await import("@/lib/unified-trades");
  const { tickers } = await getTickerIndex();
  return tickers.slice(0, 30).map((entry) => ({ symbol: entry.ticker }));
}
