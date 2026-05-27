"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PortfolioCongressSignals } from "@/lib/portfolio-signals";
import { SavedPortfolio } from "@/types/portfolio";

interface PortfolioSignalsPanelProps {
  portfolio: SavedPortfolio | null;
}

export function PortfolioSignalsPanel({ portfolio }: PortfolioSignalsPanelProps) {
  const [signals, setSignals] = useState<PortfolioCongressSignals | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!portfolio?.holdings.length) {
      setSignals(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/portfolio-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: portfolio.holdings }),
    })
      .then((response) => response.json())
      .then((data: PortfolioCongressSignals) => {
        if (!cancelled) setSignals(data);
      })
      .catch(() => {
        if (!cancelled) setSignals(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [portfolio]);

  if (!portfolio?.holdings.length) {
    return null;
  }

  return (
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <CardTitle className="text-lg">Congress vs your book</CardTitle>
        <CardDescription>
          Instant overlap analysis — no AI wait. Updated when your holdings
          change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        {loading && (
          <p className="text-sm text-muted-foreground">Analyzing overlap…</p>
        )}

        {signals && (
          <>
            <p className="rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm leading-relaxed">
              {signals.summary}
            </p>

            {signals.overlapTrades.length > 0 && (
              <SignalSection title="Overlapping trades" icon={TrendingUp}>
                <div className="space-y-2">
                  {signals.overlapTrades.slice(0, 6).map((trade, index) => (
                    <div
                      key={`${trade.ticker}-${trade.politicianId}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/80 px-3 py-2"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/ticker/${trade.ticker}`}
                            className="ticker-symbol hover:text-primary"
                          >
                            ${trade.ticker}
                          </Link>
                          <Badge
                            variant={
                              trade.type === "Purchase" ? "gain" : "loss"
                            }
                            className="text-[10px]"
                          >
                            {trade.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {trade.politicianName} · {trade.amount}
                        </p>
                      </div>
                      <Link
                        href={`/politician/${trade.politicianId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </SignalSection>
            )}

            {signals.missingClusters.length > 0 && (
              <SignalSection title="Crowd signals you don't hold" icon={Layers}>
                <div className="space-y-2">
                  {signals.missingClusters.map((cluster) => (
                    <Link
                      key={cluster.ticker}
                      href={`/ticker/${cluster.ticker}`}
                      className="block rounded-lg border border-border/80 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="ticker-symbol">${cluster.ticker}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {cluster.politicianCount} members · {cluster.netFlow}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cluster.headline}
                      </p>
                    </Link>
                  ))}
                </div>
              </SignalSection>
            )}

            {signals.highConvictionIdeas.length > 0 && (
              <SignalSection title="High-signal ideas not in book">
                <div className="space-y-2">
                  {signals.highConvictionIdeas.map((idea) => (
                    <Link
                      key={`${idea.ticker}-${idea.politicianName}`}
                      href={`/ticker/${idea.ticker}`}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/80 px-3 py-2 hover:border-primary/30"
                    >
                      <div>
                        <span className="font-medium">${idea.ticker}</span>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {idea.headline}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-primary">
                        {idea.score}
                      </span>
                    </Link>
                  ))}
                </div>
              </SignalSection>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SignalSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof TrendingUp;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </p>
      {children}
    </div>
  );
}
