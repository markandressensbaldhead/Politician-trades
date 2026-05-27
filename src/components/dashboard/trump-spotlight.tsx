import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  Landmark,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
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
import { cn, formatCompactUsd, formatDate, formatPercent, formatUsd } from "@/lib/utils";

export async function TrumpSpotlight() {
  const {
    profile,
    djtPrice,
    djtChange,
    djtName,
    filingCount,
    disclosedPositions,
    latestFilings,
    estimatedStakeValue,
  } = await getTrumpSpotlightData();
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

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            label="Est. DJT Stake"
            value={
              estimatedStakeValue != null
                ? formatCompactUsd(estimatedStakeValue)
                : "—"
            }
            sublabel="~114.75M shares × live price"
          />
          <SpotlightStat
            label="Disclosed Items"
            value={String(disclosedPositions)}
            sublabel="OGE holdings & events"
          />
          <SpotlightStat
            label="SEC Filings"
            value={String(filingCount)}
            sublabel="DJT & related issuers"
          />
        </div>

        {latestFilings.length > 0 && (
          <section className="space-y-3 rounded-md border border-terminal-amber/30 bg-background/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-terminal-amber">
                Latest SEC Filings
              </h3>
              <Link
                href={`/politician/${profile.id}`}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-terminal-amber"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {latestFilings.map((filing) => (
                <div
                  key={filing.id}
                  className="flex flex-col gap-2 rounded-md border border-terminal-amber/20 bg-terminal-amber/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-terminal-amber/20 font-mono text-[10px] text-terminal-amber hover:bg-terminal-amber/20">
                        {filing.recencyLabel}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {filing.form}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {filing.categoryLabel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{filing.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Filed {formatDate(filing.filedAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="shrink-0"
                  >
                    <a
                      href={filing.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
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
