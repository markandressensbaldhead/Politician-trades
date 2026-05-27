"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

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

export function LeaderboardPanel({ entries, source }: LeaderboardPanelProps) {
  const [chamberFilter, setChamberFilter] = useState<ChamberFilter>("all");

  const counts = useMemo(
    () => ({
      all: entries.length,
      senate: entries.filter((entry) => entry.chamber === "Senate").length,
      house: entries.filter((entry) => entry.chamber === "House").length,
    }),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    if (chamberFilter === "all") return entries;
    const chamber = chamberFilter === "senate" ? "Senate" : "House";
    return entries.filter((entry) => entry.chamber === chamber);
  }, [entries, chamberFilter]);

  return (
    <div className="surface-card overflow-hidden">
      <div className="surface-header flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <h2 className="section-title">Top performers</h2>
          <p className="section-description">
            Ranked by estimated return vs. the S&amp;P 500 over the last 90 days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="status-pill">
            {source === "live" ? "Live data" : "Sample data"}
          </span>
          <ChamberFilterBar
            value={chamberFilter}
            onChange={setChamberFilter}
            counts={counts}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
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
                  colSpan={6}
                  className="py-16 text-center font-mono text-sm text-muted-foreground"
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
