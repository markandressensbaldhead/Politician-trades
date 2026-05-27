import type { Metadata } from "next";

import { SearchResults } from "@/components/search/search-results";
import { PageHeader } from "@/components/layout/page-header";
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
    <SiteContainer className="pb-16">
      <PageHeader
        eyebrow="Search"
        title="Find a member or ticker"
        description={
          source === "live"
            ? `${politicians.length} members and ${tickers.length} active tickers in our index.`
            : getLiveDataSetupMessage()
        }
      />

      <SearchResults politicians={politicians} tickers={tickers} source={source} />
    </SiteContainer>
  );
}
