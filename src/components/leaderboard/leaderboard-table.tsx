"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Politician } from "@/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface LeaderboardTableProps {
  politicians: Politician[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function partyVariant(party: Politician["party"]) {
  switch (party) {
    case "Democrat":
      return "secondary" as const;
    case "Republican":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export function LeaderboardTable({ politicians }: LeaderboardTableProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>Politician</TableHead>
            <TableHead>Chamber</TableHead>
            <TableHead className="text-right">YTD Return</TableHead>
            <TableHead className="text-right">Portfolio</TableHead>
            <TableHead className="text-right">Trades</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {politicians.map((politician, index) => (
            <TableRow key={politician.id}>
              <TableCell className="font-mono text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/politician/${politician.id}`}
                  className="group flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-xs">
                      {getInitials(politician.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {politician.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {politician.state}
                      {politician.district ? `-${politician.district}` : ""}
                    </p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={partyVariant(politician.party)}>
                    {politician.party.charAt(0)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {politician.chamber}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-mono tabular-nums font-medium",
                    politician.ytdReturn >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  {politician.ytdReturn >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatPercent(politician.ytdReturn)}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrency(politician.portfolioValue)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {politician.totalTrades}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {politician.winRate.toFixed(1)}%
              </TableCell>
              <TableCell>
                <Link
                  href={`/politician/${politician.id}`}
                  className="inline-flex text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
