import type { Metadata } from "next";

import { TickerPageContent } from "@/components/ticker/ticker-page-content";

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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <TickerPageContent symbol={params.symbol} />
    </div>
  );
}
