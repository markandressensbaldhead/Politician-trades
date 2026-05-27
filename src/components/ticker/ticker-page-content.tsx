import Link from "next/link";

import { LiveTradeFeed } from "@/components/dashboard/live-trade-feed";
import { DisclosureLagBadge } from "@/components/shared/disclosure-lag-badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMarketPulse } from "@/lib/trade-analytics";
import { getTradesByTicker, toLegacyRecentTrade } from "@/lib/unified-trades";
import { formatDate } from "@/lib/utils";

interface TickerPageProps {
  symbol: string;
}

export async function TickerPageContent({ symbol }: TickerPageProps) {
  const ticker = symbol.toUpperCase();
  const { trades, source } = await getTradesByTicker(ticker);

  const purchases = trades.filter((trade) => trade.type === "Purchase").length;
  const sales = trades.length - purchases;
  const politicians = new Set(trades.map((trade) => trade.politicianId)).size;
  const pulse = getMarketPulse(trades);
  const recentLegacy = trades.slice(0, 100).map(toLegacyRecentTrade);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-terminal-amber">
          Stock-Centric View
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Who in Congress traded{" "}
          <span className="font-mono text-terminal-amber">{ticker}</span>?
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Every disclosed buy and sell for this ticker — with disclosure lag,
          party breakdown, and links to member profiles. This is the view
          QuiverQuant and Capitol Trades users search for daily.
        </p>
        {source === "mock" && (
          <p className="rounded-md border border-terminal-amber/30 bg-terminal-amber/5 px-3 py-2 text-sm text-terminal-amber">
            Demo data — add QUIVERQUANT_API_KEY for live congressional trades.
          </p>
        )}
      </div>

      {trades.length === 0 ? (
        <Card className="border-border/60 bg-card/40">
          <CardContent className="py-12 text-center text-muted-foreground">
            No disclosed congressional trades found for {ticker} yet.
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Total Trades" value={String(trades.length)} />
        <SummaryStat label="Politicians" value={String(politicians)} />
        <SummaryStat label="Purchases" value={String(purchases)} highlight="gain" />
        <SummaryStat label="Sales" value={String(sales)} highlight="loss" />
      </div>

      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle>Congressional Activity</CardTitle>
          <CardDescription>
            {purchases > sales
              ? `Net buying pressure — ${Math.round((purchases / Math.max(trades.length, 1)) * 100)}% purchases`
              : sales > purchases
                ? `Net selling pressure — ${Math.round((sales / Math.max(trades.length, 1)) * 100)}% sales`
                : "Mixed buy/sell activity"}
            {pulse.avgDisclosureLagDays != null &&
              ` · avg ${pulse.avgDisclosureLagDays} day disclosure lag`}
          </CardDescription>
        </CardHeader>
        <CardContent className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Politician</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Trade Date</TableHead>
                <TableHead>Disclosure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.slice(0, 50).map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>
                    <Link
                      href={`/politician/${trade.politicianId}`}
                      className="font-medium hover:text-terminal-amber"
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
                    <Badge variant={trade.type === "Purchase" ? "gain" : "loss"}>
                      {trade.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {trade.amount}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatDate(trade.tradeDate)}
                  </TableCell>
                  <TableCell>
                    <DisclosureLagBadge days={trade.disclosureLagDays} />
                  </TableCell>
                </TableRow>
              ))}
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

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "gain" | "loss";
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
        {label}
      </p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
          highlight === "gain"
            ? "text-gain"
            : highlight === "loss"
              ? "text-loss"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export async function generateTickerStaticParams() {
  const { getTickerIndex } = await import("@/lib/unified-trades");
  const { tickers } = await getTickerIndex();
  return tickers.slice(0, 30).map((entry) => ({ symbol: entry.ticker }));
}
