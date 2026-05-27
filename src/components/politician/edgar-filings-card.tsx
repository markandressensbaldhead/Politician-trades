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
import { EdgarFiling, FilingInsight, GroupedFilings, InvestmentSummary } from "@/types";
import { InvestmentActivityList } from "@/components/politician/investment-activity-list";
import { cn, formatDate } from "@/lib/utils";

interface FilingsApiResponse {
  filings: EdgarFiling[];
  latest: EdgarFiling[];
  grouped: GroupedFilings[];
  investments?: InvestmentSummary[];
  locked?: boolean;
  storedCount?: number;
}

interface EdgarFilingsCardProps {
  politicianId: string;
  politicianName: string;
}

function FilingRow({
  filing,
  featured = false,
}: {
  filing: EdgarFiling;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between",
        featured
          ? "border-terminal-amber/50 bg-terminal-amber/10 shadow-[0_0_24px_rgba(245,158,11,0.08)]"
          : "border-border/60 bg-background/30"
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {featured && (
            <Badge className="bg-terminal-amber/20 font-mono text-[10px] text-terminal-amber hover:bg-terminal-amber/20">
              Latest
            </Badge>
          )}
          <Badge variant="outline" className="font-mono text-[10px]">
            {filing.form}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {filing.categoryLabel}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {formatDate(filing.filedAt)} · {filing.recencyLabel}
          </span>
          {filing.ticker && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {filing.ticker}
            </Badge>
          )}
        </div>
        <p className={cn("font-medium", featured && "text-base")}>
          {filing.entityName}
        </p>
        {filing.investmentSummary ? (
          <p className="text-sm leading-6 text-foreground/90">
            {filing.investmentSummary.plainSummary}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{filing.title}</p>
        )}
        {filing.investmentSummary?.filingContext && (
          <p className="text-xs text-muted-foreground">
            {filing.investmentSummary.filingContext}
          </p>
        )}
      </div>

      <Button
        variant={featured ? "default" : "outline"}
        size="sm"
        asChild
        className={featured ? "shrink-0" : "shrink-0"}
      >
        <a href={filing.documentUrl} target="_blank" rel="noopener noreferrer">
          View Filing
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    </div>
  );
}

export function EdgarFilingsCard({
  politicianId,
  politicianName,
}: EdgarFilingsCardProps) {
  const [filings, setFilings] = useState<EdgarFiling[]>([]);
  const [latest, setLatest] = useState<EdgarFiling[]>([]);
  const [grouped, setGrouped] = useState<GroupedFilings[]>([]);
  const [investments, setInvestments] = useState<InvestmentSummary[]>([]);
  const [locked, setLocked] = useState(false);
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
        const data = (await response.json()) as FilingsApiResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load SEC filings");
        }

        if (!cancelled) {
          setFilings(data.filings ?? []);
          setLatest(data.latest ?? []);
          setGrouped(data.grouped ?? []);
          setInvestments(data.investments ?? []);
          setLocked(Boolean(data.locked));
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

  const featuredIds = useMemo(
    () => new Set(latest.map((filing) => filing.id)),
    [latest]
  );

  return (
    <Card className="terminal-panel overflow-hidden border-border/60 bg-card/40">
      <CardHeader className="terminal-header border-b border-border/60">
        <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-terminal-amber">
          <FileText className="h-4 w-4" />
          SEC EDGAR Filings
        </CardTitle>
        <CardDescription>
          {locked
            ? "Locked SEC EDGAR records from database — synced and linked to disclosed trades."
            : "Ranked by recency — newest material events and insider filings appear first"}{" "}
          for {politicianName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 p-6">
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
          <>
            {investments.length > 0 && (
              <section className="space-y-3 rounded-md border border-terminal-amber/30 bg-terminal-amber/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-amber">
                    What They Invested In
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Plain English · what · how much · when
                  </span>
                </div>
                <InvestmentActivityList
                  investments={investments}
                  politicianName={politicianName}
                />
              </section>
            )}

            {latest.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-amber">
                    Latest Filings
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Most recent · highest visibility
                  </span>
                </div>
                {latest.map((filing) => (
                  <FilingRow key={filing.id} filing={filing} featured />
                ))}
              </section>
            )}

            {grouped
              .map((group) => ({
                ...group,
                filings: group.filings.filter(
                  (filing) => !featuredIds.has(filing.id)
                ),
              }))
              .filter((group) => group.filings.length > 0)
              .map((group) => (
              <section key={group.category} className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                  <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/90">
                    {group.label}
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {group.filings.length} filing
                    {group.filings.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.filings.map((filing) => (
                      <FilingRow key={filing.id} filing={filing} />
                    ))}
                </div>
              </section>
            ))}
          </>
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
