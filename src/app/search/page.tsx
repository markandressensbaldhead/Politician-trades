import type { Metadata } from "next";

import { SearchResults } from "@/components/search/search-results";
import { getSearchIndex } from "@/lib/congress-data";

export const metadata: Metadata = {
  title: "Search",
  description: "Search congressional stock trading profiles by name, state, or committee.",
};

export default async function SearchPage() {
  const { politicians, source } = await getSearchIndex();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Search Politicians
        </h1>
        <p className="text-muted-foreground">
          Find members of Congress and review their reported stock activity.
          {source === "live"
            ? ` ${politicians.length} members with disclosed trades.`
            : " Showing demo data — add QUIVERQUANT_API_KEY for live results."}
        </p>
      </div>

      <SearchResults politicians={politicians} source={source} />
    </div>
  );
}
