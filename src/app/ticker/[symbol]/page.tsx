import type { Metadata } from "next";

import { TickerPageContent } from "@/components/ticker/ticker-page-content";
import { SiteContainer } from "@/components/layout/site-container";

interface PageProps {
  params: { symbol: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const symbol = params.symbol.toUpperCase();

  return {
    title: `${symbol} Congressional Trades`,
    description: `See every member of Congress who disclosed trading ${symbol}, with amounts, dates, and disclosure lag.`,
  };
}

export default function TickerPage({ params }: PageProps) {
  return (
    <SiteContainer className="py-6">
      <TickerPageContent symbol={params.symbol} />
    </SiteContainer>
  );
}
