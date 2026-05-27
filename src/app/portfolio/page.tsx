import type { Metadata } from "next";

import { PortfolioPageContent } from "@/components/portfolio/portfolio-page-content";
import { SiteContainer } from "@/components/layout/site-container";

export const metadata: Metadata = {
  title: "Portfolio Advisor",
  description:
    "Link your Robinhood portfolio and get AI research tailored to your holdings vs congressional trades.",
};

export default function PortfolioPage() {
  return (
    <SiteContainer>
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
    </SiteContainer>
  );
}
