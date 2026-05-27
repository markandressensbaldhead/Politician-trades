import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";

import { AiInsightsCard } from "@/components/politician/ai-insights-card";
import { EdgarFilingsCard } from "@/components/politician/edgar-filings-card";
import { ExecutiveAlphaBrief } from "@/components/politician/executive-alpha-brief";
import { FollowPoliticianButton } from "@/components/politician/follow-politician-button";
import {
  ProfileNav,
  ProfileSection,
} from "@/components/politician/profile-nav";
import { ProfileIntelligence } from "@/components/politician/profile-intelligence";
import { PerformanceChart } from "@/components/politician/performance-chart";
import { TradeHistoryTable } from "@/components/politician/trade-history-table";
import { ExportCsvLink } from "@/components/shared/export-csv-button";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PoliticianProfileData, UnifiedCongressTrade } from "@/types";
import { PoliticianAlphaBrief } from "@/types/alpha-brief";
import {
  getCommitteeOverlapFlags,
  getDisclosureLagDays,
  getPoliticianLagStats,
  getSectorActivity,
} from "@/lib/trade-analytics";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface PoliticianProfileProps {
  politician: PoliticianProfileData;
  initialAlphaBrief?: PoliticianAlphaBrief | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PoliticianProfile({
  politician,
  initialAlphaBrief = null,
}: PoliticianProfileProps) {
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

  const hasTrades = politician.trades.length > 0;

  return (
    <div className="pb-12">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="shrink-0 -ml-2">
          <Link href="/" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="surface-card overflow-hidden shadow-sm">
        <div className="surface-header p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="photo-placeholder shrink-0 self-start">
              <Avatar className="h-20 w-20 border-0 bg-transparent sm:h-24 sm:w-24">
                <AvatarFallback className="bg-secondary text-xl font-semibold sm:text-2xl">
                  {getInitials(politician.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-2">
                <span
                  className={cn(
                    "status-pill",
                    politician.source === "live" && "status-pill-live"
                  )}
                >
                  {politician.source === "live"
                    ? "Live data"
                    : politician.source === "disclosure"
                      ? "Financial disclosure"
                      : "Sample profile"}
                </span>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-3xl font-semibold sm:text-4xl">
                    {politician.name}
                  </h1>
                  <PartyBadge party={politician.party} />
                  <Badge variant="outline" className="rounded-full text-xs">
                    {politician.chamber}
                  </Badge>
                </div>

                {politician.officeTitle && (
                  <p className="text-base text-foreground/90">
                    {politician.officeTitle}
                  </p>
                )}

                {locationParts.length > 0 && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {locationParts.join(" · ")}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FollowPoliticianButton
                  politicianId={politician.id}
                  politicianName={politician.name}
                />
                {hasTrades && (
                  <ExportCsvLink
                    href={`/api/export/trades?politician=${encodeURIComponent(politician.id)}`}
                    label="Export CSV"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-border/40 bg-border/40 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card/80 px-4 py-4 sm:px-5"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p
                className={cn(
                  "mt-1.5 flex items-center gap-1 text-xl font-semibold tabular-nums sm:text-2xl",
                  stat.highlight === true && "text-gain",
                  stat.highlight === false && "text-loss"
                )}
              >
                {stat.highlight !== undefined &&
                  (stat.highlight ? (
                    <TrendingUp className="h-5 w-5 shrink-0" />
                  ) : (
                    <TrendingDown className="h-5 w-5 shrink-0" />
                  ))}
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {hasTrades && (
        <div className="mt-8">
          <ExecutiveAlphaBrief
            politicianId={politician.id}
            politicianName={politician.name}
            initialBrief={initialAlphaBrief}
          />
        </div>
      )}

      <ProfileNav hasTrades={hasTrades} className="mt-8" />

      <div
        className={cn(
          "mt-8 grid gap-8",
          hasTrades ? "xl:grid-cols-12" : "max-w-4xl"
        )}
      >
        <aside className="order-1 space-y-6 xl:order-2 xl:col-span-4 xl:sticky xl:top-28 xl:self-start">
          {hasTrades && (
            <ProfileSection id="overview">
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

              <ProfileIntelligence
                politicianName={politician.name}
                lagStats={lagStats}
                sectors={sectors}
                overlapFlags={overlapFlags}
              />
            </ProfileSection>
          )}
        </aside>

        <div
          className={cn(
            "order-2 space-y-8",
            hasTrades ? "xl:order-1 xl:col-span-8" : ""
          )}
        >
          <ProfileSection id="research">
            <AiInsightsCard
              politicianId={politician.id}
              politicianName={politician.name}
            />
          </ProfileSection>

          <ProfileSection id="filings">
            <EdgarFilingsCard
              politicianId={politician.id}
              politicianName={politician.name}
            />
          </ProfileSection>
        </div>
      </div>

      {hasTrades && (
        <ProfileSection id="trades" className="mt-8">
          <TradeHistoryTable
            trades={politician.trades}
            politicianName={politician.name}
            politicianParty={politician.party}
            politicianChamber={politician.chamber}
            showExcessReturn={
              politician.source === "live" ||
              politician.source === "disclosure"
            }
          />
        </ProfileSection>
      )}
    </div>
  );
}
