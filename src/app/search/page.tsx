import type { Metadata } from "next";

import { SearchResults } from "@/components/search/search-results";
import { getSearchIndex, getAllTrades } from "@/lib/congress-data";
import { getTrendingTickers } from "@/lib/trade-analytics";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search congressional stock trading by politician name or ticker symbol.",
};

export default async function SearchPage() {
  const [{ politicians, source }, { trades }] = await Promise.all([
    getSearchIndex(),
    getAllTrades(),
  ]);

  const tickers = getTrendingTickers(trades, 50, 365);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Find members of Congress or jump straight to a ticker — the workflow
          investors actually use.
          {source === "live"
            ? ` ${politicians.length} members · ${tickers.length} tickers with activity.`
            : " Showing demo data — add QUIVERQUANT_API_KEY for live results."}
        </p>
      </div>

      <SearchResults politicians={politicians} tickers={tickers} source={source} />
    </div>
  );
}
