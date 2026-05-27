"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PortfolioAdviceResponse,
  SavedPortfolio,
} from "@/types/portfolio";
import { BRAND, COPY } from "@/lib/brand";

interface PortfolioAdvisorProps {
  portfolio: SavedPortfolio | null;
}

export function PortfolioAdvisor({ portfolio }: PortfolioAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioAdviceResponse | null>(null);

  const generateAdvice = useCallback(async () => {
    if (!portfolio || portfolio.holdings.length === 0) {
      setError("Link your portfolio first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings: portfolio.holdings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate advice");
      }

      setResult(data as PortfolioAdviceResponse);
    } catch (adviceError) {
      setError(
        adviceError instanceof Error
          ? adviceError.message
          : "Failed to generate advice"
      );
    } finally {
      setLoading(false);
    }
  }, [portfolio]);

  return (
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              AI portfolio advisor
            </CardTitle>
            <CardDescription className="max-w-2xl leading-relaxed">
              Compare your holdings to {COPY.hillFlow} — overlaps, crowd
              activity, and high-conviction {BRAND.hill} signals you may be
              missing.
            </CardDescription>
          </div>
          <Button
            onClick={generateAdvice}
            disabled={loading || !portfolio?.holdings.length}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Generate advice"
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {!portfolio?.holdings.length && (
          <p className="text-sm text-muted-foreground">
            Import your Robinhood CSV or add holdings above to get personalized
            research.
          </p>
        )}

        {error && <p className="text-sm text-loss">{error}</p>}

        {result && (
          <div className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-5">
              <p className="text-lg font-semibold">{result.advice.headline}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {result.advice.portfolioSummary}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Based on {result.holdingsCount} holdings and{" "}
                {result.congressTradesReviewed.toLocaleString()} {COPY.hillTrades}{" "}
                reviewed · Updated{" "}
                {new Date(result.generatedAt).toLocaleString()}
              </p>
            </div>

            {result.advice.overlaps.length > 0 && (
              <AdviceSection title={`${COPY.hillFlow} in your holdings`}>
                <div className="space-y-3">
                  {result.advice.overlaps.map((overlap) => (
                    <div
                      key={overlap.ticker}
                      className="rounded-lg border border-border bg-secondary/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/ticker/${overlap.ticker}`}
                          className="ticker-symbol hover:text-primary"
                        >
                          {overlap.ticker}
                        </Link>
                        <Badge variant="outline" className="text-[10px]">
                          {overlap.yourQuantity} shares held
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm">{overlap.congressActivity}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {overlap.note}
                      </p>
                    </div>
                  ))}
                </div>
              </AdviceSection>
            )}

            {result.advice.opportunities.length > 0 && (
              <AdviceSection title={`${COPY.hillSignal} to review`}>
                <div className="space-y-3">
                  {result.advice.opportunities.map((item) => (
                    <div
                      key={`${item.ticker}-${item.direction}`}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/ticker/${item.ticker}`}
                          className="ticker-symbol hover:text-primary"
                        >
                          {item.ticker}
                        </Link>
                        <Badge variant="secondary">{item.direction}</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {item.conviction} conviction
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm">{item.rationale}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {COPY.hillSignal}: {item.congressSignal}
                      </p>
                    </div>
                  ))}
                </div>
              </AdviceSection>
            )}

            {result.advice.risks.length > 0 && (
              <AdviceSection title="Portfolio risks">
                <ul className="space-y-2 text-sm">
                  {result.advice.risks.map((risk) => (
                    <li
                      key={`${risk.ticker}-${risk.concern}`}
                      className="rounded-lg border border-loss/20 bg-loss/5 px-4 py-3"
                    >
                      <span className="font-medium">{risk.ticker}:</span>{" "}
                      {risk.concern}
                    </li>
                  ))}
                </ul>
              </AdviceSection>
            )}

            {result.advice.actions.length > 0 && (
              <AdviceSection title="Suggested next steps">
                <ol className="space-y-3">
                  {result.advice.actions.map((item, index) => (
                    <li
                      key={`${item.action}-${index}`}
                      className="rounded-lg border border-border bg-background/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.priority} priority
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium">{item.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.rationale}
                      </p>
                    </li>
                  ))}
                </ol>
              </AdviceSection>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              For research and education only — not personalized investment
              advice. {BRAND.hill} disclosures can lag trades by up to 45 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdviceSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
