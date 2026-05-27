import type { Metadata } from "next";

import { SearchResults } from "@/components/search/search-results";
import { SiteContainer } from "@/components/layout/site-container";
import { BRAND } from "@/lib/brand";
import { getLiveDataSetupMessage } from "@/lib/data-provider";
import { getSearchIndex, getAllTrades } from "@/lib/congress-data";
import { getTrendingTickers } from "@/lib/trade-analytics";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search trades on the Hill by politician name or ticker symbol.",
};

export default async function SearchPage() {
  const [{ politicians, source }, { trades }] = await Promise.all([
    getSearchIndex(),
    getAllTrades(),
  ]);

  const tickers = getTrendingTickers(trades, 50, 365);

  return (
    <SiteContainer>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Search the Hill</h1>
        <p className="text-muted-foreground">
          Find {BRAND.hill} members or jump straight to a ticker — the workflow
          retail actually uses.
          {source === "live"
            ? ` ${politicians.length} members · ${tickers.length} tickers with activity.`
            : ` ${getLiveDataSetupMessage()}`}
        </p>
      </div>

      <SearchResults politicians={politicians} tickers={tickers} source={source} />
    </SiteContainer>
  );
}
