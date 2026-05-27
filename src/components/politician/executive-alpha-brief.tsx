"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Target,
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
  Long: { badge: "gain", label: "Long" },
  Short: { badge: "loss", label: "Short" },
  Watch: { badge: "secondary", label: "Watch" },
  Reduce: { badge: "outline", label: "Reduce" },
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
      className="scroll-mt-28 overflow-hidden rounded-xl border border-terminal-amber/30 bg-gradient-to-br from-terminal-amber/[0.08] via-card/60 to-background/80 shadow-[0_0_60px_-20px_rgba(245,158,11,0.25)]"
    >
      <div className="border-b border-terminal-amber/20 bg-terminal-amber/[0.06] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-terminal-amber" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terminal-amber">
                30-Day Alpha Brief
              </p>
            </div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Executive Summary
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Highest-conviction signals from {politicianName}&apos;s last month
              of disclosures — how to express the flow with capital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
            {brief && (
              <p className="text-xs text-muted-foreground">
                {brief.cached ? "Cached" : "Fresh"} · {brief.tradesInWindow}{" "}
                trades in {brief.windowDays}d · {formatDate(brief.generatedAt)}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => void fetchBrief(true)}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh brief
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-terminal-amber" />
            <span className="text-sm">Building 30-day alpha brief...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-loss/30 bg-loss/5 p-5">
            <p className="text-sm font-medium text-loss">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Requires trades and{" "}
              <a href="/setup" className="text-primary underline-offset-4 hover:underline">
                ANTHROPIC_API_KEY
              </a>
              . Run schema setup if the alpha brief table is missing.
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Capital Deployment Ideas
            </h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {brief.deploymentIdeas.map((idea) => {
              const style = DIRECTION_STYLES[idea.direction];

              return (
                <article
                  key={`${idea.ticker}-${idea.direction}`}
                  className="rounded-lg border border-border/60 bg-background/40 p-5 transition-colors hover:border-terminal-amber/30"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/ticker/${idea.ticker}`}
                      className="font-mono text-lg font-bold tracking-tight hover:text-terminal-amber"
                    >
                      {idea.ticker}
                    </Link>
                    <Badge variant={style.badge}>{style.label}</Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {idea.conviction} conviction
                    </Badge>
                  </div>

                  <p className="text-sm leading-7 text-foreground/90">
                    {idea.rationale}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground/80">
                        Catalyst:{" "}
                      </span>
                      {idea.catalyst}
                    </p>
                    {idea.sizeHint && (
                      <p>
                        <span className="font-medium text-foreground/80">
                          Size:{" "}
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
          <InsightBlock title="Sector Theme" body={brief.sectorTheme} />
        )}
        {brief.timingEdge && (
          <InsightBlock title="Timing Edge" body={brief.timingEdge} />
        )}
        {brief.riskManagement && (
          <InsightBlock title="Risk Management" body={brief.riskManagement} accent="risk" />
        )}
      </div>

      {brief.playbook && (
        <div className="rounded-lg border border-gain/25 bg-gain/[0.06] p-5 sm:p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gain">
            Capital Playbook
          </p>
          <p className="text-[15px] leading-8 text-foreground/95">
            {brief.playbook}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Signal research on {politicianName}&apos;s disclosures — not personalized
            investment advice. Size positions to your risk budget and verify filings
            before deploying capital.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <Button variant="outline" size="sm" asChild>
          <a href="#research" className="gap-2">
            Full desk memo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="#trades" className="gap-2">
            Source trades
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
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-terminal-amber">
        {title}
      </p>
      <p className="text-sm leading-7 text-foreground/90">{body}</p>
    </div>
  );
}
