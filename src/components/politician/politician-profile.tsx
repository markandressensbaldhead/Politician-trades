import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";

import { AiInsightsCard } from "@/components/politician/ai-insights-card";
import { EdgarFilingsCard } from "@/components/politician/edgar-filings-card";
import { FollowPoliticianButton } from "@/components/politician/follow-politician-button";
import { ProfileIntelligence } from "@/components/politician/profile-intelligence";
import { PerformanceChart } from "@/components/politician/performance-chart";
import { TradeHistoryTable } from "@/components/politician/trade-history-table";
import { ExportCsvLink } from "@/components/shared/export-csv-button";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { PoliticianProfileData, UnifiedCongressTrade } from "@/types";
import {
  getCommitteeOverlapFlags,
  getDisclosureLagDays,
  getPoliticianLagStats,
  getSectorActivity,
} from "@/lib/trade-analytics";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

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
  const unifiedTrades: UnifiedCongressTrade[] = politician.trades.map(
    (trade) => ({
      id: trade.id,
      politicianId: politician.id,
      politicianName: politician.name,
      party: politician.party,
      chamber: politician.chamber,
      ticker: trade.ticker,
      company: trade.company,
      type:
        trade.type === "Sale"
          ? "Sale"
          : trade.type === "Purchase"
            ? "Purchase"
            : "Purchase",
      amount: trade.amount,
      tradeDate: trade.tradeDate,
      filingDate: trade.filingDate,
      disclosureLagDays: getDisclosureLagDays(trade.tradeDate, trade.filingDate),
      sector: trade.sector ?? "",
      excessReturn: trade.excessReturn ?? null,
    })
  );

  const lagStats = getPoliticianLagStats(unifiedTrades);
  const sectors = getSectorActivity(unifiedTrades);
  const overlapFlags = getCommitteeOverlapFlags({
    trades: unifiedTrades,
    committee: politician.committee,
  });

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
                  {politician.source === "live"
                    ? "Live Profile"
                    : politician.source === "disclosure"
                      ? "OGE Disclosure Profile"
                      : "Demo Profile"}
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

              {politician.officeTitle && (
                <p className="font-mono text-sm text-foreground/90">
                  {politician.officeTitle}
                </p>
              )}

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

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <FollowPoliticianButton
                  politicianId={politician.id}
                  politicianName={politician.name}
                />
                <ExportCsvLink
                  href={`/api/export/trades?politician=${encodeURIComponent(politician.id)}`}
                  label="Export CSV"
                />
              </div>
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

      {politician.trades.length > 0 && (
        <PerformanceChart
          politicianName={politician.name}
          trades={politician.trades.map((trade) => ({
            tradeDate: trade.tradeDate,
            type: trade.type,
            excessReturn: trade.excessReturn,
            priceChange: trade.priceChange,
            spyChange: trade.spyChange,
          }))}
        />
      )}

      {politician.trades.length > 0 && (
        <ProfileIntelligence
          politicianName={politician.name}
          lagStats={lagStats}
          sectors={sectors}
          overlapFlags={overlapFlags}
        />
      )}

      <AiInsightsCard
        politicianId={politician.id}
        politicianName={politician.name}
      />

      <EdgarFilingsCard
        politicianId={politician.id}
        politicianName={politician.name}
      />

      <TradeHistoryTable
        trades={politician.trades}
        politicianName={politician.name}
        politicianParty={politician.party}
        politicianChamber={politician.chamber}
        showExcessReturn={
          politician.source === "live" || politician.source === "disclosure"
        }
      />
    </div>
  );
}
