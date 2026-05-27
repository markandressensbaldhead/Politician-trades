"use client";

import { useEffect, useState } from "react";

import { PortfolioAdvisor } from "@/components/portfolio/portfolio-advisor";
import { PortfolioConnect } from "@/components/portfolio/portfolio-connect";
import { useSnapTradeCallbackSync } from "@/components/portfolio/snaptrade-connect";
import { loadPortfolio } from "@/lib/portfolio-storage";
import { SavedPortfolio } from "@/types/portfolio";

export function PortfolioPageContent() {
  const [portfolio, setPortfolio] = useState<SavedPortfolio | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPortfolio(loadPortfolio());
  }, []);

  useSnapTradeCallbackSync(setPortfolio, setStatusMessage, setError);

  return (
    <div className="space-y-8">
      {statusMessage && (
        <p className="rounded-lg border border-gain/20 bg-gain/10 px-4 py-3 text-sm text-gain">
          {statusMessage}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-loss/20 bg-loss/10 px-4 py-3 text-sm text-loss">
          {error}
        </p>
      )}

      <PortfolioConnect
        portfolio={portfolio}
        onPortfolioChange={setPortfolio}
        onStatusMessage={setStatusMessage}
        onError={setError}
      />
      <PortfolioAdvisor portfolio={portfolio} />
    </div>
  );
}
