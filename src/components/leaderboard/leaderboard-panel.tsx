"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

import { EdgeTierBadge } from "@/components/shared/edge-tier-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChamberFilterBar } from "@/components/leaderboard/chamber-filter";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChamberFilter, LeaderboardEntry } from "@/types";
import { cn, formatPercent } from "@/lib/utils";

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  source: "live" | "mock";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRankStyle(rank: number) {
  if (rank === 1) return "text-primary";
  if (rank === 2) return "text-foreground/80";
  if (rank === 3) return "text-foreground/60";
  return "text-muted-foreground";
}

type LeaderboardSort = "edge" | "return";

export function LeaderboardPanel({ entries, source }: LeaderboardPanelProps) {
  const [chamberFilter, setChamberFilter] = useState<ChamberFilter>("all");
  const [sortBy, setSortBy] = useState<LeaderboardSort>("edge");

  const counts = useMemo(
    () => ({
      all: entries.length,
      senate: entries.filter((entry) => entry.chamber === "Senate").length,
      house: entries.filter((entry) => entry.chamber === "House").length,
    }),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const chamberFiltered =
      chamberFilter === "all"
        ? entries
        : entries.filter(
            (entry) =>
              entry.chamber === (chamberFilter === "senate" ? "Senate" : "House")
          );

    return [...chamberFiltered].sort((a, b) => {
      if (sortBy === "edge") {
        if ((b.edgeScore ?? 0) !== (a.edgeScore ?? 0)) {
          return (b.edgeScore ?? 0) - (a.edgeScore ?? 0);
        }
      }

      if (b.returnVsSpy !== a.returnVsSpy) {
        return b.returnVsSpy - a.returnVsSpy;
      }

      return b.tradesLast90Days - a.tradesLast90Days;
    });
  }, [entries, chamberFilter, sortBy]);

  return (
    <div className="surface-card overflow-hidden">
      <div className="surface-header flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <h2 className="section-title">Who beats the S&amp;P</h2>
          <p className="section-description">
            Copy-study list — default sort is repeatable edge (hit rate +
            consistency), not one lucky headline trade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="status-pill">
            {source === "live" ? "Live data" : "Sample data"}
          </span>
          <div className="flex rounded-lg border border-border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={sortBy === "edge" ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setSortBy("edge")}
            >
              Repeatable edge
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sortBy === "return" ? "default" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setSortBy("return")}
            >
              vs S&amp;P
            </Button>
          </div>
          <ChamberFilterBar
            value={chamberFilter}
            onChange={setChamberFilter}
            counts={counts}
          />
        </div>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {filteredEntries.map((entry, index) => {
          const rank = index + 1;
          const isPositive = entry.returnVsSpy >= 0;

          return (
            <Link
              key={entry.id}
              href={`/politician/${entry.id}`}
              className="block rounded-xl border border-border/70 bg-background/40 p-4 transition-colors hover:border-primary/25"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    #{String(rank).padStart(2, "0")}
                  </p>
                  <p className="mt-1 font-semibold">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.chamber}
                    {entry.state ? ` · ${entry.state}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-base font-semibold tabular-nums",
                      isPositive ? "text-gain" : "text-loss"
                    )}
                  >
                    {formatPercent(entry.returnVsSpy)}
                  </p>
                  <p className="text-xs text-muted-foreground">Edge {entry.edgeScore ?? "—"}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-16 text-xs font-medium text-muted-foreground">
                Rank
              </TableHead>
              <TableHead className="min-w-[220px] text-xs font-medium text-muted-foreground">
                Politician
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Party
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">
                Trades (90D)
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">
                Edge
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">
                vs. S&amp;P 500
              </TableHead>
              <TableHead className="w-32 text-right text-xs font-medium text-muted-foreground">
                
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  No politicians match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry, index) => {
                const rank = index + 1;
                const isPositive = entry.returnVsSpy >= 0;

                return (
                  <TableRow
                    key={entry.id}
                  className="border-border transition-colors hover:bg-secondary/40"
                  >
                    <TableCell>
                      <span
                        className={cn(
                          "text-lg font-semibold tabular-nums",
                          getRankStyle(rank)
                        )}
                      >
                        {String(rank).padStart(2, "0")}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="photo-placeholder shrink-0">
                          <Avatar className="h-10 w-10 border-0 bg-transparent">
                            <AvatarFallback className="bg-secondary/80 text-xs font-semibold text-foreground">
                              {getInitials(entry.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium tracking-tight">
                            {entry.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.chamber}
                            {entry.state
                              ? ` · ${entry.state}${entry.district ? `-${entry.district}` : ""}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <PartyBadge party={entry.party} />
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-base font-semibold tabular-nums">
                        {entry.tradesLast90Days}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-semibold tabular-nums text-primary">
                          {entry.edgeScore ?? "—"}
                        </span>
                        {entry.edgeTier && (
                          <EdgeTierBadge tier={entry.edgeTier} compact />
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center justify-end gap-1.5 text-base font-semibold tabular-nums",
                          isPositive ? "text-gain" : "text-loss"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatPercent(entry.returnVsSpy)}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        vs. benchmark
                      </p>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-sm"
                      >
                        <Link href={`/politician/${entry.id}`}>
                          View profile
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6">
        <p className="text-xs text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} members
        </p>
      </div>
    </div>
  );
}
