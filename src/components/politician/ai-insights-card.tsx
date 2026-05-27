"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

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

  useEffect(() => {
    let cancelled = false;

    async function fetchInsight() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/insights/${encodeURIComponent(politicianId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load AI insights");
        }

        if (!cancelled) {
          setInsight({
            analysis: data.analysis,
            generatedAt: data.generatedAt,
            cached: data.cached,
          });
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load AI insights"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInsight();

    return () => {
      cancelled = true;
    };
  }, [politicianId]);

  const paragraphs =
    insight?.analysis
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean) ?? [];

  return (
    <Card className="terminal-panel overflow-hidden border-border/60 bg-card/40">
      <CardHeader className="terminal-header border-b border-border/60">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-terminal-amber">
              <Sparkles className="h-4 w-4" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Claude-powered analysis of {politicianName}&apos;s trading patterns
            </CardDescription>
          </div>

          {insight && (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {insight.cached ? "Cached" : "Fresh"} · Updated{" "}
                {formatDate(insight.generatedAt)}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Regenerates weekly
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-terminal-amber" />
            <span className="font-mono text-sm">
              Analyzing trade history...
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-md border border-loss/30 bg-loss/5 p-4">
            <p className="font-mono text-sm text-loss">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try refreshing the page. If the issue persists, check{" "}
              <a href="/setup" className="text-primary underline-offset-4 hover:underline">
                /setup
              </a>{" "}
              for missing API keys.
            </p>
          </div>
        )}

        {!loading && !error && insight && (
          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-7 text-foreground/90 sm:text-[15px]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
