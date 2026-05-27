import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UnusualWhalesCongressStats } from "@/lib/unusual-whales";

interface CongressStatsPanelProps {
  stats: UnusualWhalesCongressStats;
}

function formatStatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  return JSON.stringify(value);
}

function flattenStats(
  stats: UnusualWhalesCongressStats
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];

  if (stats.date) {
    rows.push({ label: "As of", value: stats.date });
  }

  if (stats.type) {
    rows.push({ label: "Window", value: stats.type });
  }

  const data = stats.data;
  if (!data || typeof data !== "object") {
    return rows;
  }

  for (const [key, value] of Object.entries(data)) {
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>
      )) {
        rows.push({
          label: `${key} · ${nestedKey.replace(/_/g, " ")}`,
          value: formatStatValue(nestedValue),
        });
      }
      continue;
    }

    rows.push({
      label: key.replace(/_/g, " "),
      value: formatStatValue(value),
    });
  }

  return rows.slice(0, 8);
}

export function CongressStatsPanel({ stats }: CongressStatsPanelProps) {
  const rows = flattenStats(stats);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-500/[0.05] via-card to-card">
      <CardHeader className="border-b border-border/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 border-sky-500/30 text-[10px]">
            Unusual Whales
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            Congress unusual trades
          </Badge>
        </div>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          Unusual activity snapshot
        </CardTitle>
        <CardDescription>
          Aggregate congressional trading stats from Unusual Whales — size,
          timing, and flow outliers across the Hill.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-border/80 bg-background/50 p-3"
          >
            <p className="text-[11px] font-medium capitalize text-muted-foreground">
              {row.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{row.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
