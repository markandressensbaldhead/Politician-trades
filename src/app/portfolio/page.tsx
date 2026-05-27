import type { Metadata } from "next";

import { PortfolioPageContent } from "@/components/portfolio/portfolio-page-content";

export const metadata: Metadata = {
  title: "Portfolio Advisor",
  description:
    "Link your Robinhood portfolio and get AI research tailored to your holdings vs congressional trades.",
};

export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <p className="page-eyebrow">Personalized research</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Portfolio advisor
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Connect Robinhood with secure OAuth, import a CSV, or add holdings
          manually — then get AI research tailored to your book vs. congressional
          trades.
        </p>
      </div>

      <PortfolioPageContent />
    </div>
  );
}
