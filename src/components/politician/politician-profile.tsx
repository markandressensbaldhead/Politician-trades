import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";

import { AiInsightsCard } from "@/components/politician/ai-insights-card";
import { FollowPoliticianButton } from "@/components/politician/follow-politician-button";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PoliticianProfileData } from "@/types";
import { cn, formatCurrency, formatDate, formatPercent } from "@/lib/utils";

interface PoliticianProfileProps {
  politician: PoliticianProfileData;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PoliticianProfile({ politician }: PoliticianProfileProps) {
  const stats = [
    {
      label: "vs. S&P 500 (90D)",
      value: formatPercent(politician.returnVsSpy),
      highlight: politician.returnVsSpy >= 0,
    },
    {
      label: "Trades (90 Days)",
      value: politician.tradesLast90Days.toString(),
    },
    {
      label: "Total Trades",
      value: politician.totalTrades.toString(),
    },
    ...(politician.winRate !== undefined
      ? [
          {
            label: "Win Rate (90D)",
            value: `${politician.winRate.toFixed(1)}%`,
          },
        ]
      : []),
    ...(politician.portfolioValue !== undefined
      ? [
          {
            label: "Portfolio Value",
            value: formatCurrency(politician.portfolioValue),
          },
        ]
      : []),
  ];

  const locationParts = [
    politician.state,
    politician.district ? `District ${politician.district}` : null,
    politician.committee ? `${politician.committee} Committee` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="terminal-panel flex-1 overflow-hidden">
          <div className="terminal-header flex flex-col gap-6 border-b border-border/60 p-6 sm:flex-row sm:items-center">
            <div className="photo-placeholder shrink-0">
              <Avatar className="h-20 w-20 border-0 bg-transparent">
                <AvatarFallback className="bg-secondary/80 text-xl font-semibold">
                  {getInitials(politician.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="live-dot" />
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terminal-amber">
                  {politician.source === "live" ? "Live Profile" : "Demo Profile"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {politician.name}
                </h1>
                <PartyBadge party={politician.party} />
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {politician.chamber}
                </Badge>
              </div>

              {locationParts.length > 0 && (
                <p className="font-mono text-sm text-muted-foreground">
                  {locationParts.join(" · ")}
                </p>
              )}

              {politician.bioGuideId && (
                <p className="font-mono text-[11px] text-muted-foreground">
                  BioGuide ID: {politician.bioGuideId}
                </p>
              )}

              <FollowPoliticianButton
                politicianId={politician.id}
                politicianName={politician.name}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border/60 bg-card/50 backdrop-blur-sm"
          >
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                {stat.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-bold font-mono tabular-nums",
                  stat.highlight === true && "text-gain",
                  stat.highlight === false && "text-loss"
                )}
              >
                {stat.highlight !== undefined &&
                  (stat.highlight ? (
                    <TrendingUp className="mr-1 inline h-5 w-5" />
                  ) : (
                    <TrendingDown className="mr-1 inline h-5 w-5" />
                  ))}
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AiInsightsCard
        politicianId={politician.id}
        politicianName={politician.name}
      />

      <Card className="terminal-panel overflow-hidden border-border/60 bg-card/40">
        <CardHeader className="terminal-header border-b border-border/60">
          <CardTitle className="font-mono text-sm uppercase tracking-[0.2em] text-terminal-amber">
            Trade History
          </CardTitle>
          <CardDescription>
            Reported stock transactions from financial disclosures
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  Trade Date
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  Filed
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  Ticker
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  Asset
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  Type
                </TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  Amount
                </TableHead>
                {politician.source === "live" && (
                  <TableHead className="text-right font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                    vs. SPY
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {politician.trades.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={politician.source === "live" ? 7 : 6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No trades on record.
                  </TableCell>
                </TableRow>
              ) : (
                politician.trades.map((trade) => {
                  const isPositive = (trade.excessReturn ?? 0) >= 0;

                  return (
                    <TableRow
                      key={trade.id}
                      className="border-border/40 hover:bg-gain/5"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDate(trade.tradeDate)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDate(trade.filingDate)}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {trade.ticker}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{trade.company}</p>
                          {trade.sector && (
                            <p className="text-xs text-muted-foreground">
                              {trade.sector}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.type === "Purchase" ? "gain" : "loss"
                          }
                        >
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {trade.amount}
                      </TableCell>
                      {politician.source === "live" && (
                        <TableCell className="text-right">
                          {trade.excessReturn !== undefined ? (
                            <span
                              className={cn(
                                "font-mono tabular-nums font-medium",
                                isPositive ? "text-gain" : "text-loss"
                              )}
                            >
                              {formatPercent(trade.excessReturn)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
