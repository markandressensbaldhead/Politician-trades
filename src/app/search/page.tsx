import type { Metadata } from "next";

import { SearchResults } from "@/components/search/search-results";
import { politicians } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search",
  description: "Search congressional stock trading profiles by name, state, or committee.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Search Politicians
        </h1>
        <p className="text-muted-foreground">
          Find members of Congress and review their reported stock activity.
        </p>
      </div>

      <SearchResults politicians={politicians} />
    </div>
  );
}
