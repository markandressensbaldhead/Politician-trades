import Link from "next/link";
import { ArrowUpRight, Landmark, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PartyBadge } from "@/components/leaderboard/party-badge";
import { getTrumpSpotlightData } from "@/lib/trump-data";
import { cn, formatPercent, formatUsd } from "@/lib/utils";

export async function TrumpSpotlight() {
  const { profile, djtPrice, djtChange, djtName, filingCount, disclosedPositions } =
    await getTrumpSpotlightData();
  const isPositive = (djtChange ?? 0) >= 0;

  return (
    <Card className="overflow-hidden border-terminal-amber/30 bg-gradient-to-br from-terminal-amber/10 via-card/40 to-card/20">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-terminal-amber" />
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terminal-amber">
                Executive Spotlight
              </p>
            </div>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription className="max-w-2xl">
              {profile.officeTitle}. Tracked via OGE financial disclosure
              reports, live market data (Yahoo Finance), and SEC EDGAR filings
              for Trump-linked public companies — not STOCK Act congressional
              trades.
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <PartyBadge party={profile.party} />
              <span className="rounded border border-border/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Executive Branch
              </span>
            </div>
          </div>

          <Button asChild className="font-mono text-xs uppercase tracking-wider">
            <Link href={`/politician/${profile.id}`}>
              Full Trump Profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
        <SpotlightStat
          label="Flagship Stock (DJT)"
          value={djtPrice != null ? formatUsd(djtPrice) : "—"}
          sublabel={djtName}
          highlight={isPositive}
          extra={
            djtChange != null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-mono text-sm",
                  isPositive ? "text-gain" : "text-loss"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatPercent(djtChange)}
              </span>
            ) : null
          }
        />
        <SpotlightStat
          label="Disclosed Positions"
          value={String(disclosedPositions)}
          sublabel="OGE + public filings"
        />
        <SpotlightStat
          label="SEC Filings Pulled"
          value={String(filingCount)}
          sublabel="DJT & related issuers"
        />
        <SpotlightStat
          label="Watchlist Day Move"
          value={formatPercent(profile.returnVsSpy)}
          sublabel="Avg across disclosed tickers"
          highlight={profile.returnVsSpy >= 0}
        />
      </CardContent>
    </Card>
  );
}

function SpotlightStat({
  label,
  value,
  sublabel,
  highlight,
  extra,
}: {
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terminal-amber">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tabular-nums",
          highlight === true && "text-gain",
          highlight === false && "text-loss"
        )}
      >
        {value}
      </p>
      {extra}
      <p className="mt-2 text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}
