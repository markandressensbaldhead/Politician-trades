import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

import { EdgeTierBadge } from "@/components/shared/edge-tier-badge";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeaderboardEntry } from "@/types";
import { cn, formatPercent } from "@/lib/utils";

interface EdgeLeadersPanelProps {
  entries: LeaderboardEntry[];
  limit?: number;
}

export function EdgeLeadersPanel({ entries, limit = 5 }: EdgeLeadersPanelProps) {
  const leaders = [...entries]
    .filter((entry) => entry.edgeTier !== "cosplay")
    .sort((a, b) => {
      if ((b.edgeScore ?? 0) !== (a.edgeScore ?? 0)) {
        return (b.edgeScore ?? 0) - (a.edgeScore ?? 0);
      }
      return b.returnVsSpy - a.returnVsSpy;
    })
    .slice(0, limit);

  return (
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Repeatable edge leaders
            </CardTitle>
            <CardDescription className="max-w-2xl leading-relaxed">
              Separates copy-study politicians from legalized insider cosplay —
              ranked by hit rate, consistency, and sample size, not one lucky
              headline trade.
            </CardDescription>
          </div>
          <span className="status-pill gap-1.5">
            <Sparkles className="h-3 w-3" />
            Actionable alpha
          </span>
        </div>
      </CardHeader>

      <CardContent className="divide-y divide-border p-0">
        {leaders.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Not enough scored trades yet to rank repeatable edge.
          </p>
        ) : (
          leaders.map((entry, index) => (
            <div
              key={entry.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/politician/${entry.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {entry.name}
                    </Link>
                    <PartyBadge party={entry.party} className="px-1.5 py-0 text-[10px]" />
                    <EdgeTierBadge
                      tier={entry.edgeTier ?? "insufficient"}
                      score={entry.edgeScore}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {entry.edgeActionHint ?? entry.edgeLabel}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 pl-9 sm:pl-0">
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Edge score</p>
                  <p className="text-lg font-semibold tabular-nums text-primary">
                    {entry.edgeScore ?? 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Hit rate</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {entry.edgeWinRate != null
                      ? `${Math.round(entry.edgeWinRate)}%`
                      : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">vs S&P</p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      entry.returnVsSpy >= 0 ? "text-gain" : "text-loss"
                    )}
                  >
                    {formatPercent(entry.returnVsSpy)}
                  </p>
                </div>
                <Link
                  href={`/politician/${entry.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Study
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
