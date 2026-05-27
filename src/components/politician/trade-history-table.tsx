"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { DisclosureLagBadge } from "@/components/shared/disclosure-lag-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarketQuote, ProfileTrade } from "@/types";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { profileTradeToCsvRow, slugifyFilename } from "@/lib/csv-export";
import { translateTradeToInvestment } from "@/lib/filing-translator";
import { getDisclosureLagDays } from "@/lib/trade-analytics";
import { cn, formatDate, formatPercent, formatUsd } from "@/lib/utils";

interface TradeHistoryTableProps {
  trades: ProfileTrade[];
  showExcessReturn: boolean;
  politicianName?: string;
  politicianParty?: string;
  politicianChamber?: string;
}

function TradeMeta({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-background/30 px-3 py-2.5">
      <p className="field-label">{label}</p>
      <div
        className={cn(
          "mt-1 text-sm font-medium tabular-nums text-foreground",
          valueClassName
        )}
      >
        {value}
      </div>
    </div>
  );
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
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Trade History
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              Every reported transaction with plain-English summaries, live
              prices, and linked SEC filings when available.
            </CardDescription>
          </div>
          <ExportCsvButton
            rows={csvRows}
            filename={`${slugifyFilename(politicianName)}-trades.csv`}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {trades.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No trades on record.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {trades.map((trade) => {
              const quote = quotes[trade.ticker.toUpperCase()];
              const isPositive = (trade.excessReturn ?? 0) >= 0;
              const changePositive = (quote?.changePercent ?? 0) >= 0;
              const lagDays = getDisclosureLagDays(
                trade.tradeDate,
                trade.filingDate
              );
              const investment = translateTradeToInvestment(
                trade,
                politicianName,
                trade.secFilings ?? []
              );

              return (
                <article
                  key={trade.id}
                  className="space-y-4 p-5 transition-colors hover:bg-gain/[0.03] sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/ticker/${trade.ticker}`}
                          className="ticker-symbol text-xl hover:text-primary"
                        >
                          {trade.ticker}
                        </Link>
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
                        <DisclosureLagBadge days={lagDays} />
                      </div>

                      <p className="text-sm leading-relaxed text-foreground/90">
                        {trade.company}
                        {trade.sector && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {trade.sector}
                          </span>
                        )}
                      </p>

                      {trade.disclosureType && (
                        <p className="text-xs text-muted-foreground">
                          {trade.disclosureType.replace(/-/g, " ")}
                        </p>
                      )}

                      {trade.sourceNote && (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {trade.sourceNote}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-lg font-semibold tabular-nums">
                        {trade.amount}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <TradeMeta
                      label="Trade date"
                      value={formatDate(trade.tradeDate)}
                    />
                    <TradeMeta
                      label="Filed"
                      value={formatDate(trade.filingDate)}
                    />
                    <TradeMeta
                      label="Price"
                      value={
                        loadingQuotes ? (
                          "…"
                        ) : quote?.price != null ? (
                          formatUsd(quote.price)
                        ) : (
                          "—"
                        )
                      }
                    />
                    <TradeMeta
                      label="Day change"
                      value={
                        loadingQuotes ? (
                          "…"
                        ) : quote?.changePercent != null ? (
                          formatPercent(quote.changePercent)
                        ) : (
                          "—"
                        )
                      }
                      valueClassName={cn(
                        quote?.changePercent != null &&
                          (changePositive ? "text-gain" : "text-loss")
                      )}
                    />
                    {showExcessReturn && (
                      <TradeMeta
                        label="vs. SPY"
                        value={
                          trade.excessReturn !== undefined
                            ? formatPercent(trade.excessReturn)
                            : "—"
                        }
                        valueClassName={cn(
                          trade.excessReturn !== undefined &&
                            (isPositive ? "text-gain" : "text-loss")
                        )}
                      />
                    )}
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/40 p-4">
                    <p className="mb-2 field-label">Plain English</p>
                    <p className="text-sm leading-7 text-foreground/95">
                      {investment.plainSummary}
                    </p>
                  </div>

                  {trade.secFilings && trade.secFilings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trade.secFilings.slice(0, 3).map((filing) => (
                        <a
                          key={filing.id}
                          href={filing.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-background/30 px-3 py-1.5 text-xs transition-colors hover:border-primary/30 hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                          <span className="font-medium">{filing.form}</span>
                          <span className="text-muted-foreground">
                            {formatDate(filing.filedAt)}
                          </span>
                        </a>
                      ))}
                      {trade.secFilings.length > 3 && (
                        <span className="self-center px-1 text-xs text-muted-foreground">
                          +{trade.secFilings.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
