"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EdgarFiling, FilingInsight } from "@/types";
import { formatDate } from "@/lib/utils";

interface EdgarFilingsCardProps {
  politicianId: string;
  politicianName: string;
}

export function EdgarFilingsCard({
  politicianId,
  politicianName,
}: EdgarFilingsCardProps) {
  const [filings, setFilings] = useState<EdgarFiling[]>([]);
  const [insight, setInsight] = useState<FilingInsight | null>(null);
  const [loadingFilings, setLoadingFilings] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFilings() {
      setLoadingFilings(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/filings/${encodeURIComponent(politicianId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load SEC filings");
        }

        if (!cancelled) {
          setFilings(data.filings ?? []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load SEC filings"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingFilings(false);
        }
      }
    }

    loadFilings();

    return () => {
      cancelled = true;
    };
  }, [politicianId]);

  useEffect(() => {
    if (filings.length === 0 && !loadingFilings) {
      setLoadingInsight(false);
      return;
    }

    if (loadingFilings) {
      return;
    }

    let cancelled = false;

    async function loadInsight() {
      setLoadingInsight(true);

      try {
        const response = await fetch(
          `/api/filing-insights/${encodeURIComponent(politicianId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to analyze filings");
        }

        if (!cancelled) {
          setInsight(data);
        }
      } catch {
        if (!cancelled) {
          setInsight(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingInsight(false);
        }
      }
    }

    loadInsight();

    return () => {
      cancelled = true;
    };
  }, [politicianId, filings.length, loadingFilings]);

  const insightParagraphs = useMemo(
    () =>
      insight?.analysis
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean) ?? [],
    [insight?.analysis]
  );

  return (
    <Card className="terminal-panel overflow-hidden border-border/60 bg-card/40">
      <CardHeader className="terminal-header border-b border-border/60">
        <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-terminal-amber">
          <FileText className="h-4 w-4" />
          SEC EDGAR Filings
        </CardTitle>
        <CardDescription>
          Official SEC filings linked to {politicianName}&apos;s traded
          companies, analyzed by Claude
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {loadingFilings ? (
          <div className="flex items-center gap-3 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-terminal-amber" />
            <span className="font-mono text-sm">Searching SEC EDGAR...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-loss">{error}</p>
        ) : filings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matching SEC filings found for this profile yet.
          </p>
        ) : (
          <div className="space-y-3">
            {filings.slice(0, 8).map((filing) => (
              <div
                key={filing.id}
                className="flex flex-col gap-2 rounded-md border border-border/60 bg-background/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {filing.form}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      Filed {formatDate(filing.filedAt)}
                    </span>
                    {filing.ticker && (
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {filing.ticker}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{filing.entityName}</p>
                  <p className="text-xs text-muted-foreground">
                    {filing.source === "politician-search"
                      ? "Matched politician name in EDGAR"
                      : "Company filing for traded ticker"}
                  </p>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <a
                    href={filing.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Filing
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md border border-border/60 bg-background/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-terminal-amber" />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-terminal-amber">
              Claude Filing Analysis
            </p>
          </div>

          {loadingInsight ? (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-terminal-amber" />
              <span className="font-mono text-sm">
                Extracting data from filings...
              </span>
            </div>
          ) : insight ? (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {insight.cached ? "Cached" : "Fresh"} · {insight.filingsReviewed}{" "}
                filings reviewed · Updated {formatDate(insight.generatedAt)}
              </p>
              {insightParagraphs.map((paragraph, index) => (
                <p key={index} className="text-sm leading-7 text-foreground/90">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Filing analysis will appear once SEC documents are available.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
