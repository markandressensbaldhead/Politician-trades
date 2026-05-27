"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";

import { DisclosureLagBadge } from "@/components/shared/disclosure-lag-badge";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecentCongressTrade } from "@/lib/congress-data";
import { slugifyFilename, unifiedTradeToCsvRow } from "@/lib/csv-export";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { filterTrades } from "@/lib/trade-analytics";
import { UnifiedCongressTrade, Party, Chamber } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface LiveTradeFeedProps {
  trades: RecentCongressTrade[];
  showFilters?: boolean;
  title?: string;
  description?: string;
  exportFilename?: string;
}

function toUnified(trade: RecentCongressTrade): UnifiedCongressTrade {
  return {
    id: trade.id,
    politicianId: trade.politicianId,
    politicianName: trade.politicianName,
    party: trade.party as Party,
    chamber: trade.chamber as Chamber,
    ticker: trade.ticker,
    company: trade.company,
    type: trade.type,
    amount: trade.amount,
    tradeDate: trade.date,
    filingDate: trade.filingDate,
    disclosureLagDays: trade.disclosureLagDays,
    sector: trade.sector,
    excessReturn: trade.excessReturn,
  };
}

export function LiveTradeFeed({
  trades,
  showFilters = true,
  title = "Recent trades",
  description = "Search and filter recent stock disclosures from members of Congress.",
  exportFilename = "capitol-trades-feed.csv",
}: LiveTradeFeedProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "Purchase" | "Sale">("all");
  const [days, setDays] = useState<number>(90);

  const filtered = useMemo(() => {
    const unified = trades.map(toUnified);
    return filterTrades(unified, { query, type, days }).slice(0, 80);
  }, [trades, query, type, days]);

  const exportRows = useMemo(
    () => filtered.map((trade) => unifiedTradeToCsvRow(trade)),
    [filtered]
  );

  return (
    <Card className="surface-card overflow-hidden shadow-sm">
      <CardHeader className="surface-header">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Filter className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          </div>
          <ExportCsvButton rows={exportRows} filename={exportFilename} />
        </div>
        {showFilters && (
          <div className="flex flex-col gap-3 pt-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by ticker, name, sector..."
                className="pl-9 bg-background/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "Purchase", "Sale"] as const).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={type === value ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setType(value)}
                >
                  {value === "all" ? "All" : value}
                </Button>
              ))}
              {[30, 90, 365].map((window) => (
                <Button
                  key={window}
                  size="sm"
                  variant={days === window ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setDays(window)}
                >
                  {window}D
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {filtered.map((trade) => (
            <article
              key={trade.id}
              className="flex flex-col gap-3 p-4 transition-colors hover:bg-gain/5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/politician/${trade.politicianId}`}
                    className="font-semibold hover:text-primary"
                  >
                    {trade.politicianName}
                  </Link>
                  <PartyBadge party={trade.party} />
                  <Badge variant="outline" className="text-[10px]">
                    {trade.chamber}
                  </Badge>
                  <DisclosureLagBadge days={trade.disclosureLagDays} />
                </div>
                <p className="text-sm">
                  <Badge
                    variant={trade.type === "Purchase" ? "gain" : "loss"}
                    className="mr-2"
                  >
                    {trade.type}
                  </Badge>
                  <Link
                    href={`/ticker/${trade.ticker}`}
                    className="ticker-symbol hover:text-primary"
                  >
                    {trade.ticker}
                  </Link>{" "}
                  · {trade.company}
                </p>
                <p className="text-sm tabular-nums text-foreground/90">
                  {trade.amount}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <p>Trade {formatDate(trade.tradeDate)}</p>
                {trade.filingDate && (
                  <p>Filed {formatDate(trade.filingDate)}</p>
                )}
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No trades match your filters.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TradeFeedCards({
  trades,
  limit = 20,
}: {
  trades: RecentCongressTrade[];
  limit?: number;
}) {
  return (
    <div className="space-y-3 md:hidden">
      {trades.slice(0, limit).map((trade) => (
        <Card key={trade.id} className="border-border/60 bg-card/50">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/politician/${trade.politicianId}`}
                className="font-semibold"
              >
                {trade.politicianName}
              </Link>
              <DisclosureLagBadge days={trade.disclosureLagDays} />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={trade.type === "Purchase" ? "gain" : "loss"}>
                {trade.type}
              </Badge>
              <Link
                href={`/ticker/${trade.ticker}`}
                className="ticker-symbol"
              >
                {trade.ticker}
              </Link>
            </div>
            <p className="text-sm tabular-nums">{trade.amount}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(trade.date)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
