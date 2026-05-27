"use client";

import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildPerformanceSeries,
  buildSvgPath,
  getChartBounds,
  PerformanceTradeInput,
} from "@/lib/performance-chart";
import { formatPercent } from "@/lib/utils";

interface PerformanceChartProps {
  politicianName: string;
  trades: PerformanceTradeInput[];
}

export function PerformanceChart({
  politicianName,
  trades,
}: PerformanceChartProps) {
  const summary = useMemo(
    () => buildPerformanceSeries(trades),
    [trades]
  );

  const width = 640;
  const height = 220;
  const { minY, maxY } = getChartBounds(summary.points);

  const portfolioPath = buildSvgPath(
    summary.points,
    summary.hasSpyBenchmark ? "portfolioCumulative" : "excessCumulative",
    width,
    height,
    minY,
    maxY
  );
  const spyPath = buildSvgPath(
    summary.points,
    "spyCumulative",
    width,
    height,
    minY,
    maxY
  );
  const zeroY =
    height - ((0 - minY) / (maxY - minY || 1)) * height;

  if (summary.tradesWithData === 0) {
    return (
      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-terminal-amber">
            Performance vs S&amp;P 500
          </CardTitle>
          <CardDescription>
            Return data will appear once trades include benchmark metrics from
            QuiverQuant.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-terminal-amber">
              Performance vs S&amp;P 500
            </CardTitle>
            <CardDescription>
              Cumulative return across disclosed trades for {politicianName} —
              portfolio line vs SPY benchmark.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-xs">
            <LegendItem
              color="hsl(var(--gain))"
              label={
                summary.hasSpyBenchmark
                  ? "Portfolio (est.)"
                  : "Excess vs SPY"
              }
              value={formatPercent(
                summary.hasSpyBenchmark
                  ? summary.totalPortfolioReturn
                  : summary.totalExcessVsSpy
              )}
            />
            {summary.hasSpyBenchmark && (
              <LegendItem
                color="hsl(var(--muted-foreground))"
                label="S&P 500 (SPY)"
                value={formatPercent(summary.totalSpyReturn)}
              />
            )}
            <LegendItem
              color="hsl(var(--terminal-amber))"
              label="Edge vs SPY"
              value={formatPercent(summary.totalExcessVsSpy)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-border/60 bg-background/30 p-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full min-w-[320px]"
            role="img"
            aria-label={`Performance chart for ${politicianName}`}
          >
            <line
              x1={0}
              y1={zeroY}
              x2={width}
              y2={zeroY}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
            />
            {summary.hasSpyBenchmark && spyPath && (
              <path
                d={spyPath}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                opacity={0.85}
              />
            )}
            {portfolioPath && (
              <path
                d={portfolioPath}
                fill="none"
                stroke="hsl(var(--gain))"
                strokeWidth={2.5}
              />
            )}
            {summary.points.map((point, index) => {
              const x =
                summary.points.length <= 1
                  ? width / 2
                  : (index / (summary.points.length - 1)) * width;
              const value = summary.hasSpyBenchmark
                ? point.portfolioCumulative
                : point.excessCumulative;
              const y =
                height - ((value - minY) / (maxY - minY || 1)) * height;

              return (
                <circle
                  key={`${point.date}-${index}`}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="hsl(var(--gain))"
                >
                  <title>
                    {point.label}:{" "}
                    {formatPercent(
                      summary.hasSpyBenchmark
                        ? point.portfolioCumulative
                        : point.excessCumulative
                    )}
                  </title>
                </circle>
              );
            })}
          </svg>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Based on {summary.tradesWithData} trade
          {summary.tradesWithData !== 1 ? "s" : ""} with return data. Estimated
          from QuiverQuant price/SPY change fields — not a audited portfolio
          backtest.
        </p>
      </CardContent>
    </Card>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
