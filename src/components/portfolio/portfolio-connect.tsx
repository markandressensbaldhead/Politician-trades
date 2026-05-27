"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { parseRobinhoodCsv } from "@/lib/robinhood-csv";
import {
  clearPortfolio,
  mergeHoldings,
  savePortfolio,
} from "@/lib/portfolio-storage";
import { PortfolioHolding, SavedPortfolio } from "@/types/portfolio";
import { formatUsd } from "@/lib/utils";
import { SnapTradeConnect } from "@/components/portfolio/snaptrade-connect";

interface PortfolioConnectProps {
  portfolio: SavedPortfolio | null;
  onPortfolioChange: (portfolio: SavedPortfolio | null) => void;
  onStatusMessage?: (message: string | null) => void;
  onError?: (message: string | null) => void;
}

export function PortfolioConnect({
  portfolio,
  onPortfolioChange,
  onStatusMessage,
  onError,
}: PortfolioConnectProps) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);

  function persist(next: SavedPortfolio) {
    savePortfolio(next);
    onPortfolioChange(next);
  }

  function handleAddManual(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const normalizedTicker = ticker.trim().toUpperCase();
    const qty = Number.parseFloat(quantity);
    const cost = averageCost.trim()
      ? Number.parseFloat(averageCost)
      : undefined;

    if (!normalizedTicker || !Number.isFinite(qty) || qty <= 0) {
      setError("Enter a valid ticker and share quantity.");
      return;
    }

    const holding: PortfolioHolding = {
      ticker: normalizedTicker,
      quantity: qty,
      averageCost:
        cost != null && Number.isFinite(cost) ? Number(cost.toFixed(2)) : null,
      source: "manual",
    };

    const currentHoldings = portfolio?.holdings ?? [];
    const nextHoldings = mergeHoldings(currentHoldings, [holding]);

    persist({
      broker: portfolio?.broker ?? "manual",
      holdings: nextHoldings,
      updatedAt: new Date().toISOString(),
      label: portfolio?.label ?? "My portfolio",
    });

    setTicker("");
    setQuantity("");
    setAverageCost("");
  }

  async function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportNote(null);

    try {
      const text = await file.text();
      const result = parseRobinhoodCsv(text);

      persist({
        broker: "robinhood",
        holdings: mergeHoldings(portfolio?.holdings ?? [], result.holdings),
        updatedAt: new Date().toISOString(),
        label: "Robinhood portfolio",
      });

      setImportNote(
        `Imported ${result.holdings.length} positions from ${result.format} CSV (${result.rowsParsed} rows).`
      );
      onStatusMessage?.(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to import CSV"
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  function removeHolding(targetTicker: string) {
    if (!portfolio) return;

    const nextHoldings = portfolio.holdings.filter(
      (holding) => holding.ticker !== targetTicker
    );

    if (nextHoldings.length === 0) {
      clearPortfolio();
      onPortfolioChange(null);
      return;
    }

    persist({
      ...portfolio,
      holdings: nextHoldings,
      updatedAt: new Date().toISOString(),
    });
  }

  function disconnectPortfolio() {
    clearPortfolio();
    onPortfolioChange(null);
    setImportNote(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Card className="surface-card overflow-hidden">
        <CardHeader className="surface-header border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Wallet className="h-5 w-5 text-primary" />
                Link Robinhood portfolio
              </CardTitle>
              <CardDescription className="max-w-2xl leading-relaxed">
                Connect Robinhood with one-click OAuth (via SnapTrade), import
                a CSV export, or add positions manually. Holdings stay in your
                browser until you request AI advice.
              </CardDescription>
            </div>
            {portfolio && (
              <Badge className="status-pill-live shrink-0">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {portfolio.holdings.length} linked
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <SnapTradeConnect
            portfolio={portfolio}
            onPortfolioChange={onPortfolioChange}
            onStatusMessage={onStatusMessage ?? (() => undefined)}
            onError={onError ?? (() => undefined)}
          />

          <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-5">
            <Label htmlFor="robinhood-csv" className="text-sm font-medium">
              Import Robinhood CSV
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports stocks.csv transaction exports and simple
              Symbol/Quantity snapshots.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" disabled={importing}>
                <label htmlFor="robinhood-csv" className="cursor-pointer">
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload CSV
                    </>
                  )}
                </label>
              </Button>
              <input
                id="robinhood-csv"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvUpload}
              />
              {portfolio &&
                (portfolio.broker === "snaptrade" ||
                  portfolio.broker === "robinhood") && (
                <span className="text-xs text-muted-foreground">
                  {portfolio.broker === "snaptrade"
                    ? "Robinhood (OAuth)"
                    : "Robinhood (CSV)"}{" "}
                  · Last synced{" "}
                  {new Date(portfolio.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <form
            onSubmit={handleAddManual}
            className="grid gap-4 rounded-lg border border-border bg-secondary/10 p-5 sm:grid-cols-4"
          >
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="holding-ticker">Ticker</Label>
              <Input
                id="holding-ticker"
                placeholder="NVDA"
                value={ticker}
                onChange={(event) => setTicker(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="holding-quantity">Shares</Label>
              <Input
                id="holding-quantity"
                type="number"
                min="0"
                step="any"
                placeholder="10"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="holding-cost">Avg cost (optional)</Label>
              <Input
                id="holding-cost"
                type="number"
                min="0"
                step="any"
                placeholder="150.00"
                value={averageCost}
                onChange={(event) => setAverageCost(event.target.value)}
              />
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button type="submit" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </form>

          {importNote && (
            <p className="text-sm text-gain">{importNote}</p>
          )}
          {error && <p className="text-sm text-loss">{error}</p>}

          {portfolio && portfolio.holdings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Linked holdings</h3>
                <Button variant="ghost" size="sm" onClick={disconnectPortfolio}>
                  Clear portfolio
                </Button>
              </div>
              <div className="divide-y divide-border rounded-lg border border-border">
                {portfolio.holdings.map((holding) => (
                  <div
                    key={holding.ticker}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <Link
                        href={`/ticker/${holding.ticker}`}
                        className="ticker-symbol hover:text-primary"
                      >
                        {holding.ticker}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {holding.quantity} shares
                        {holding.averageCost != null &&
                          ` · avg ${formatUsd(holding.averageCost)}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHolding(holding.ticker)}
                      aria-label={`Remove ${holding.ticker}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
