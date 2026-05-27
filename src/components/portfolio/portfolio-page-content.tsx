"use client";

import { useState } from "react";

import { PortfolioAdvisor } from "@/components/portfolio/portfolio-advisor";
import { PortfolioConnect } from "@/components/portfolio/portfolio-connect";
import { SavedPortfolio } from "@/types/portfolio";

export function PortfolioPageContent() {
  const [portfolio, setPortfolio] = useState<SavedPortfolio | null>(null);

  return (
    <div className="space-y-8">
      <PortfolioConnect onPortfolioChange={setPortfolio} />
      <PortfolioAdvisor portfolio={portfolio} />
    </div>
  );
}
