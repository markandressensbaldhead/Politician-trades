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
  if (rank === 1) return "text-terminal-amber";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-amber-700";
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
    <div className="terminal-panel overflow-hidden">
      <div className="terminal-header flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="live-dot" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-terminal-amber">
              Performance Leaderboard
            </h2>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            Ranked by estimated excess return vs. S&amp;P 500 · Last 90 days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded border border-border/60 bg-background/50 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {source === "live" ? "Live Feed" : "Demo Data"}
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
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-16 font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
                Rank
              </TableHead>
              <TableHead className="min-w-[220px] font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
                Politician
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
                Party
              </TableHead>
              <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
                Trades (90D)
              </TableHead>
              <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
                vs. S&amp;P 500
              </TableHead>
              <TableHead className="w-32 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
                Action
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
                    className="border-border/40 transition-colors hover:bg-gain/5"
                  >
                    <TableCell>
                      <span
                        className={cn(
                          "font-mono text-lg font-bold tabular-nums",
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
                          <p className="font-mono text-[11px] text-muted-foreground">
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
                      <span className="font-mono text-base font-semibold tabular-nums">
                        {entry.tradesLast90Days}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center justify-end gap-1.5 font-mono text-base font-semibold tabular-nums",
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
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        excess return
                      </p>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-border/60 bg-background/30 font-mono text-[11px] uppercase tracking-wider hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        <Link href={`/politician/${entry.id}`}>
                          View Profile
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

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} politicians
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          Sorted by performance ↓
        </p>
      </div>
    </div>
  );
}
