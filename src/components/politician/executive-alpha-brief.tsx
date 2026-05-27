"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlphaBriefContent,
  DeploymentDirection,
  PoliticianAlphaBrief,
} from "@/types/alpha-brief";
import { cn, formatDate } from "@/lib/utils";

interface ExecutiveAlphaBriefProps {
  politicianId: string;
  politicianName: string;
  initialBrief?: PoliticianAlphaBrief | null;
}

const DIRECTION_STYLES: Record<
  DeploymentDirection,
  { badge: "gain" | "loss" | "secondary" | "outline"; label: string }
> = {
  Long: { badge: "gain", label: "Buy signal" },
  Short: { badge: "loss", label: "Sold" },
  Watch: { badge: "secondary", label: "Watch" },
  Reduce: { badge: "outline", label: "Trim" },
};

export function ExecutiveAlphaBrief({
  politicianId,
  politicianName,
  initialBrief = null,
}: ExecutiveAlphaBriefProps) {
  const [brief, setBrief] = useState<PoliticianAlphaBrief | null>(initialBrief);
  const [loading, setLoading] = useState(!initialBrief);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);

      const query = refresh ? "?refresh=1" : "";
      const alphaQuery = refresh ? "?alpha=1&refresh=1" : "?alpha=1";
      const endpoints = [
        `/api/alpha-brief/${encodeURIComponent(politicianId)}${query}`,
        `/api/insights/${encodeURIComponent(politicianId)}${alphaQuery}`,
      ];

      try {
        let lastError = "Failed to load alpha brief";

        for (const endpoint of endpoints) {
          const response = await fetch(endpoint);
          const data = await response.json();

          if (response.ok) {
            setBrief(data as PoliticianAlphaBrief);
            return;
          }

          lastError = data.error ?? lastError;
        }

        throw new Error(lastError);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load alpha brief"
        );
      } finally {
        setLoading(false);
      }
    },
    [politicianId]
  );

  useEffect(() => {
    if (!initialBrief) {
      void fetchBrief(false);
    }
  }, [fetchBrief, initialBrief]);

  return (
    <section
      id="alpha"
      className="scroll-mt-28 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="page-eyebrow">Monthly summary</p>
            <h2 className="text-xl font-semibold sm:text-2xl">
              What to know this month
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Key takeaways from {politicianName}&apos;s recent stock
              disclosures, written in plain English.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
            {brief && (
              <p className="text-xs text-muted-foreground">
                Updated {formatDate(brief.generatedAt)} · {brief.tradesInWindow}{" "}
                trades in the last {brief.windowDays} days
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 text-sm"
              onClick={() => void fetchBrief(true)}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Generating summary...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-loss/30 bg-loss/5 p-5">
            <p className="text-sm font-medium text-loss">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This feature needs trade data and an AI connection. Visit{" "}
              <a href="/setup" className="text-primary underline-offset-4 hover:underline">
                setup
              </a>{" "}
              to check your configuration.
            </p>
          </div>
        )}

        {!loading && !error && brief && (
          <AlphaBriefBody brief={brief.brief} politicianName={politicianName} />
        )}
      </div>
    </section>
  );
}

function AlphaBriefBody({
  brief,
  politicianName,
}: {
  brief: AlphaBriefContent;
  politicianName: string;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
          {brief.headline}
        </p>
        {brief.thesis && (
          <p className="max-w-4xl text-[15px] leading-8 text-foreground/90">
            {brief.thesis}
          </p>
        )}
      </div>

      {brief.deploymentIdeas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gain" />
            <h3 className="section-title">Stocks to watch</h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {brief.deploymentIdeas.map((idea) => {
              const style = DIRECTION_STYLES[idea.direction];

              return (
                <article
                  key={`${idea.ticker}-${idea.direction}`}
                  className="rounded-lg border border-border bg-secondary/20 p-5 transition-colors hover:border-primary/20"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/ticker/${idea.ticker}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {idea.ticker}
                    </Link>
                    <Badge variant={style.badge}>{style.label}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {idea.conviction} confidence
                    </Badge>
                  </div>

                  <p className="text-sm leading-7 text-foreground/90">
                    {idea.rationale}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground/80">
                        Why it matters:{" "}
                      </span>
                      {idea.catalyst}
                    </p>
                    {idea.sizeHint && (
                      <p>
                        <span className="font-medium text-foreground/80">
                          How to think about it:{" "}
                        </span>
                        {idea.sizeHint}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {brief.sectorTheme && (
          <InsightBlock title="Sector focus" body={brief.sectorTheme} />
        )}
        {brief.timingEdge && (
          <InsightBlock title="Timing" body={brief.timingEdge} />
        )}
        {brief.riskManagement && (
          <InsightBlock title="Things to watch out for" body={brief.riskManagement} accent="risk" />
        )}
      </div>

      {brief.playbook && (
        <div className="rounded-lg border border-border bg-secondary/30 p-5 sm:p-6">
          <p className="mb-2 text-sm font-semibold text-foreground">
            What this means for you
          </p>
          <p className="text-[15px] leading-8 text-foreground/90">
            {brief.playbook}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            This summary is based on public filings from {politicianName}. It is
            for research and education only — not personalized investment advice.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <Button variant="outline" size="sm" asChild>
          <a href="#research" className="gap-2">
            Full analysis
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="#trades" className="gap-2">
            View trades
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function InsightBlock({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent?: "risk";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-background/30 p-4",
        accent === "risk" && "border-loss/20 bg-loss/[0.04]"
      )}
    >
      <p className="mb-2 text-sm font-medium text-foreground">
        {title}
      </p>
      <p className="text-sm leading-7 text-foreground/90">{body}</p>
    </div>
  );
}
