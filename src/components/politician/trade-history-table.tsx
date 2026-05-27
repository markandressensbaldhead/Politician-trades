"use client";

import { useEffect, useMemo, useState } from "react";

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
import { MarketQuote, ProfileTrade } from "@/types";
import { cn, formatCompactUsd, formatDate, formatPercent, formatUsd } from "@/lib/utils";

interface TradeHistoryTableProps {
  trades: ProfileTrade[];
  showExcessReturn: boolean;
}

export function TradeHistoryTable({
  trades,
  showExcessReturn,
}: TradeHistoryTableProps) {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const tickers = useMemo(
    () => [...new Set(trades.map((trade) => trade.ticker.toUpperCase()))],
    [trades]
  );

  useEffect(() => {
    if (tickers.length === 0) {
      setLoadingQuotes(false);
      return;
    }

    let cancelled = false;

    async function loadQuotes() {
      setLoadingQuotes(true);

      try {
        const response = await fetch(
          `/api/market?tickers=${encodeURIComponent(tickers.join(","))}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load market data");
        }

        if (!cancelled) {
          setQuotes(data.quotes ?? {});
        }
      } catch {
        if (!cancelled) {
          setQuotes({});
        }
      } finally {
        if (!cancelled) {
          setLoadingQuotes(false);
        }
      }
    }

    loadQuotes();

    return () => {
      cancelled = true;
    };
  }, [tickers]);

  return (
    <Card className="terminal-panel overflow-hidden border-border/60 bg-card/40">
      <CardHeader className="terminal-header border-b border-border/60">
        <CardTitle className="font-mono text-sm uppercase tracking-[0.2em] text-terminal-amber">
          Trade History
        </CardTitle>
        <CardDescription>
          Reported transactions with live Yahoo Finance price and market cap
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Trade Date
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Filed
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Ticker
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Asset
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Type
              </TableHead>
              <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Amount
              </TableHead>
              <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Price
              </TableHead>
              <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Mkt Cap
              </TableHead>
              {showExcessReturn && (
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  vs. SPY
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showExcessReturn ? 9 : 8}
                  className="py-12 text-center text-muted-foreground"
                >
                  No trades on record.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => {
                const quote = quotes[trade.ticker.toUpperCase()];
                const isPositive = (trade.excessReturn ?? 0) >= 0;
                const changePositive = (quote?.changePercent ?? 0) >= 0;

                return (
                  <TableRow
                    key={trade.id}
                    className="border-border/40 hover:bg-gain/5"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(trade.tradeDate)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(trade.filingDate)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {trade.ticker}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{trade.company}</p>
                        {trade.sector && (
                          <p className="text-xs text-muted-foreground">
                            {trade.sector}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={trade.type === "Purchase" ? "gain" : "loss"}
                      >
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {trade.amount}
                    </TableCell>
                    <TableCell className="text-right">
                      {loadingQuotes ? (
                        <span className="text-muted-foreground">…</span>
                      ) : quote?.price != null ? (
                        <div>
                          <span className="font-mono tabular-nums">
                            {formatUsd(quote.price)}
                          </span>
                          {quote.changePercent != null && (
                            <p
                              className={cn(
                                "font-mono text-[10px] tabular-nums",
                                changePositive ? "text-gain" : "text-loss"
                              )}
                            >
                              {formatPercent(quote.changePercent)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm">
                      {loadingQuotes ? (
                        <span className="text-muted-foreground">…</span>
                      ) : quote?.marketCap != null ? (
                        formatCompactUsd(quote.marketCap)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {showExcessReturn && (
                      <TableCell className="text-right">
                        {trade.excessReturn !== undefined ? (
                          <span
                            className={cn(
                              "font-mono tabular-nums font-medium",
                              isPositive ? "text-gain" : "text-loss"
                            )}
                          >
                            {formatPercent(trade.excessReturn)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
