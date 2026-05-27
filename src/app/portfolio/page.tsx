import type { Metadata } from "next";

import { PortfolioPageContent } from "@/components/portfolio/portfolio-page-content";
import { SiteContainer } from "@/components/layout/site-container";
import { BRAND, COPY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Portfolio Advisor",
  description:
    `Link your portfolio and see where ${BRAND.hill} flow overlaps your holdings — plus AI research on Trade the Hill.`,
};

export default function PortfolioPage() {
  return (
    <SiteContainer>
      <div className="mb-8 space-y-3">
        <p className="page-eyebrow">Personalized research</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          {COPY.vsYourBook}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Connect Robinhood, import a CSV, or add holdings manually — then see
          where {COPY.hillFlow} hits your book and get AI research tailored to
          your tickers.
        </p>
      </div>

      <PortfolioPageContent />
    </SiteContainer>
  );
}
