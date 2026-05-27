"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";

import { TrendingTickers } from "@/components/dashboard/trending-tickers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { SearchPoliticianEntry } from "@/types";
import { TrendingTicker } from "@/lib/trade-analytics";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface SearchResultsProps {
  politicians: SearchPoliticianEntry[];
  tickers: TrendingTicker[];
  source: "live" | "mock";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

export function SearchResults({
  politicians: allPoliticians,
  tickers: allTickers,
  source,
}: SearchResultsProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"politicians" | "tickers">("politicians");

  const politicianResults = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return allPoliticians;

    return allPoliticians.filter(
      (politician) =>
        politician.name.toLowerCase().includes(normalized) ||
        politician.state.toLowerCase().includes(normalized) ||
        politician.party.toLowerCase().includes(normalized) ||
        politician.chamber.toLowerCase().includes(normalized) ||
        politician.committee?.toLowerCase().includes(normalized)
    );
  }, [query, allPoliticians]);

  const tickerResults = useMemo(() => {
    const normalized = query.toUpperCase().trim();
    if (!normalized) return allTickers;

    return allTickers.filter((entry) => entry.ticker.includes(normalized));
  }, [query, allTickers]);

  const directTickerMatch =
    query.trim().length >= 1 && /^[A-Za-z.]{1,6}$/.test(query.trim());

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === "politicians" ? "default" : "outline"}
          onClick={() => setMode("politicians")}
          className="text-xs"
        >
          Politicians
        </Button>
        <Button
          size="sm"
          variant={mode === "tickers" ? "default" : "outline"}
          onClick={() => setMode("tickers")}
          className="text-xs"
        >
          Tickers
        </Button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={
            mode === "politicians"
              ? "Search by name, party, or chamber..."
              : "Search ticker symbol (e.g. NVDA, AAPL)..."
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 border-border/60 bg-card/50 pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {directTickerMatch && mode === "politicians" && (
        <Link
          href={`/ticker/${query.trim().toUpperCase()}`}
          className="block rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm transition-colors hover:bg-primary/[0.08]"
        >
          Jump to{" "}
          <span className="ticker-symbol">{query.trim().toUpperCase()}</span>{" "}
          congressional trades →
        </Link>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {mode === "politicians"
            ? `${politicianResults.length} politician${politicianResults.length !== 1 ? "s" : ""} found`
            : `${tickerResults.length} ticker${tickerResults.length !== 1 ? "s" : ""} found`}
        </p>
        <span className="status-pill">
          {source === "live" ? "Live data" : "Demo data"}
        </span>
      </div>

      {mode === "politicians" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {politicianResults.map((politician) => (
            <Link key={politician.id} href={`/politician/${politician.id}`}>
              <Card className="border-border/60 bg-card/50 transition-colors hover:border-primary/30 hover:bg-card/80">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-secondary">
                      {getInitials(politician.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{politician.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {politician.party}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {politician.chamber}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {politician.state
                        ? `${politician.state}${politician.district ? `-${politician.district}` : ""} · `
                        : ""}
                      {politician.committee ??
                        `${politician.totalTrades} total trades · ${politician.tradesLast90Days} in last 90 days`}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-right sm:block">
                    <p
                      className={cn(
                        "font-semibold tabular-nums",
                        politician.returnVsSpy >= 0 ? "text-gain" : "text-loss"
                      )}
                    >
                      {formatPercent(politician.returnVsSpy)}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {source === "mock" && politician.portfolioValue
                        ? formatCurrency(politician.portfolioValue)
                        : `${politician.tradesLast90Days} trades (90d)`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {politicianResults.length === 0 && (
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="py-12 text-center">
                <CardTitle>No results found</CardTitle>
                <CardDescription>
                  Try searching by a different name, party, or chamber
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      ) : (
        <TrendingTickers
          tickers={tickerResults}
          title="Matching Tickers"
          description="Open any ticker to see every member of Congress who traded it."
        />
      )}
    </div>
  );
}
