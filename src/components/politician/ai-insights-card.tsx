"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import {
  RefreshAnalysisButton,
  ResearchDeskOutput,
} from "@/components/politician/research-desk-output";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface AiInsightsCardProps {
  politicianId: string;
  politicianName: string;
}

interface InsightResponse {
  analysis: string;
  generatedAt: string;
  cached: boolean;
}

export function AiInsightsCard({
  politicianId,
  politicianName,
}: AiInsightsCardProps) {
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);

      try {
        const query = refresh ? "?refresh=1" : "";
        const response = await fetch(
          `/api/insights/${encodeURIComponent(politicianId)}${query}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load research memo");
        }

        setInsight({
          analysis: data.analysis,
          generatedAt: data.generatedAt,
          cached: data.cached,
        });
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load research memo"
        );
      } finally {
        setLoading(false);
      }
    },
    [politicianId]
  );

  useEffect(() => {
    fetchInsight(false);
  }, [fetchInsight]);

  return (
    <Card className="terminal-panel overflow-hidden border-border/60 bg-card/40">
      <CardHeader className="terminal-header border-b border-border/60 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <Sparkles className="h-4 w-4 text-terminal-amber" />
              Washington Signal Desk
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              PM-grade memo on {politicianName}&apos;s disclosure book —
              positioning, alpha, catalysts, and risk flags.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
            {insight && (
              <p className="text-xs text-muted-foreground">
                {insight.cached ? "Cached" : "Fresh"} ·{" "}
                {formatDate(insight.generatedAt)}
              </p>
            )}
            <RefreshAnalysisButton
              loading={loading}
              onRefresh={() => fetchInsight(true)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-14 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-terminal-amber" />
            <span className="text-sm">Running desk analysis...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-loss/30 bg-loss/5 p-5">
            <p className="text-sm font-medium text-loss">{error}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Check{" "}
              <a
                href="/setup"
                className="text-primary underline-offset-4 hover:underline"
              >
                /setup
              </a>{" "}
              for ANTHROPIC_API_KEY and Supabase.
            </p>
          </div>
        )}

        {!loading && !error && insight && (
          <ResearchDeskOutput analysis={insight.analysis} />
        )}
      </CardContent>
    </Card>
  );
}
