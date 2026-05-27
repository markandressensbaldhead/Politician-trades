"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

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
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { profileTradeToCsvRow, slugifyFilename } from "@/lib/csv-export";
import { translateTradeToInvestment } from "@/lib/filing-translator";
import { cn, formatDate, formatPercent, formatUsd } from "@/lib/utils";

interface TradeHistoryTableProps {
  trades: ProfileTrade[];
  showExcessReturn: boolean;
  politicianName?: string;
  politicianParty?: string;
  politicianChamber?: string;
}

export function TradeHistoryTable({
  trades,
  showExcessReturn,
  politicianName = "This member",
  politicianParty = "",
  politicianChamber = "",
}: TradeHistoryTableProps) {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const tickers = useMemo(
    () => [...new Set(trades.map((trade) => trade.ticker.toUpperCase()))],
    [trades]
  );

  const csvRows = useMemo(
    () =>
      trades.map((trade) =>
        profileTradeToCsvRow(
          politicianName,
          politicianParty,
          politicianChamber,
          trade,
          translateTradeToInvestment(
            trade,
            politicianName,
            trade.secFilings ?? []
          ).plainSummary
        )
      ),
    [trades, politicianName, politicianParty, politicianChamber]
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-mono text-sm uppercase tracking-[0.2em] text-terminal-amber">
              Trade History
            </CardTitle>
            <CardDescription>
              Reported transactions with live Yahoo Finance prices. Linked SEC
              filings are locked from EDGAR sync when available.
            </CardDescription>
          </div>
          <ExportCsvButton
            rows={csvRows}
            filename={`${slugifyFilename(politicianName)}-trades.csv`}
          />
        </div>
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
                      Day Chg
                    </TableHead>
              {showExcessReturn && (
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  vs. SPY
                </TableHead>
              )}
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                Plain English
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                SEC Filings
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showExcessReturn ? 11 : 10}
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
                const investment = translateTradeToInvestment(
                  trade,
                  politicianName,
                  trade.secFilings ?? []
                );

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
                        {trade.sourceNote && (
                          <p className="mt-1 text-xs text-muted-foreground/80">
                            {trade.sourceNote}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={
                            trade.type === "Purchase"
                              ? "gain"
                              : trade.type === "Sale"
                                ? "loss"
                                : "secondary"
                          }
                        >
                          {trade.type}
                        </Badge>
                        {trade.disclosureType && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {trade.disclosureType.replace(/-/g, " ")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {trade.amount}
                    </TableCell>
                    <TableCell className="text-right">
                      {loadingQuotes ? (
                        <span className="text-muted-foreground">…</span>
                      ) : quote?.price != null ? (
                        <span className="font-mono tabular-nums">
                          {formatUsd(quote.price)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm">
                      {loadingQuotes ? (
                        <span className="text-muted-foreground">…</span>
                      ) : quote?.changePercent != null ? (
                        <span
                          className={cn(
                            changePositive ? "text-gain" : "text-loss"
                          )}
                        >
                          {formatPercent(quote.changePercent)}
                        </span>
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
                    <TableCell className="max-w-xs">
                      <p className="text-xs leading-6 text-foreground/90">
                        {investment.plainSummary}
                      </p>
                    </TableCell>
                    <TableCell>
                      {trade.secFilings && trade.secFilings.length > 0 ? (
                        <div className="flex max-w-xs flex-col gap-1.5">
                          {trade.secFilings.slice(0, 2).map((filing) => (
                            <a
                              key={filing.id}
                              href={filing.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-start gap-1 text-xs text-foreground/90 hover:text-terminal-amber"
                            >
                              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                              <span>
                                <span className="font-mono">{filing.form}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {formatDate(filing.filedAt)}
                                </span>
                              </span>
                            </a>
                          ))}
                          {trade.secFilings.length > 2 && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              +{trade.secFilings.length - 2} more locked
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
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
