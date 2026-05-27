"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  RefreshAnalysisButton,
  ResearchDeskOutput,
} from "@/components/politician/research-desk-output";
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
        "flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5",
        featured
          ? "border-terminal-amber/40 bg-terminal-amber/[0.07]"
          : "border-border/60 bg-background/30"
      )}
    >
      <div className="min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {featured && (
            <Badge className="bg-terminal-amber/20 text-[10px] text-terminal-amber hover:bg-terminal-amber/20">
              Latest
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {filing.form}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {filing.categoryLabel}
          </Badge>
          {filing.ticker && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {filing.ticker}
            </Badge>
          )}
        </div>

        <p className="font-medium leading-snug">{filing.entityName}</p>

        {filing.investmentSummary ? (
          <p className="text-sm leading-7 text-foreground/90">
            {filing.investmentSummary.plainSummary}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {filing.title}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {formatDate(filing.filedAt)} · {filing.recencyLabel}
        </p>

        {filing.investmentSummary?.filingContext && (
          <p className="text-xs leading-relaxed text-muted-foreground">
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

  const loadFilingInsight = useCallback(
    async (refresh = false) => {
      setLoadingInsight(true);

      try {
        const query = refresh ? "?refresh=1" : "";
        const response = await fetch(
          `/api/filing-insights/${encodeURIComponent(politicianId)}${query}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to analyze filings");
        }

        setInsight(data);
      } catch {
        setInsight(null);
      } finally {
        setLoadingInsight(false);
      }
    },
    [politicianId]
  );

  useEffect(() => {
    if (filings.length === 0 && !loadingFilings) {
      setLoadingInsight(false);
      return;
    }

    if (loadingFilings) {
      return;
    }

    void loadFilingInsight(false);
  }, [filings.length, loadingFilings, loadFilingInsight]);

  const featuredIds = useMemo(
    () => new Set(latest.map((filing) => filing.id)),
    [latest]
  );

  return (
    <Card className="terminal-panel overflow-hidden border-border/60 bg-card/40">
      <CardHeader className="terminal-header border-b border-border/60 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
          <FileText className="h-4 w-4 text-terminal-amber" />
          SEC EDGAR Filings
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-relaxed">
          {locked
            ? "Locked SEC records synced from EDGAR and linked to disclosed trades."
            : "Newest material events and insider filings for"}{" "}
          {politicianName}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 p-6 sm:p-8">
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
              <section className="space-y-4 rounded-lg border border-terminal-amber/30 bg-terminal-amber/[0.06] p-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    What They Invested In
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Plain English summaries — what, how much, when
                  </p>
                </div>
                <InvestmentActivityList
                  investments={investments}
                  politicianName={politicianName}
                />
              </section>
            )}

            {latest.length > 0 && (
              <section className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Latest Filings
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Most recent disclosures with highest visibility
                  </p>
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
              <section key={group.category} className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">
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

        <div className="rounded-lg border border-border/60 bg-background/20 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-terminal-amber" />
                <p className="text-sm font-semibold text-foreground">
                  EDGAR Linkage Memo
                </p>
              </div>
              {insight && !loadingInsight && (
                <p className="text-xs text-muted-foreground">
                  {insight.cached ? "Cached" : "Fresh"} ·{" "}
                  {insight.filingsReviewed} filings reviewed · Updated{" "}
                  {formatDate(insight.generatedAt)}
                </p>
              )}
            </div>
            <RefreshAnalysisButton
              loading={loadingInsight}
              onRefresh={() => loadFilingInsight(true)}
            />
          </div>

          {loadingInsight ? (
            <div className="flex items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-terminal-amber" />
              <span className="text-sm">Running event-driven review...</span>
            </div>
          ) : insight ? (
            <ResearchDeskOutput analysis={insight.analysis} />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              EDGAR memo will appear once SEC documents are available.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
