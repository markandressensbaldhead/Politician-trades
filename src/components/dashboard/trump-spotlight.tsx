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
    <Card className="surface-card overflow-hidden">
      <CardHeader className="surface-header border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              <p className="page-eyebrow">Executive spotlight</p>
            </div>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription className="max-w-2xl leading-relaxed">
              {profile.officeTitle}. Tracked via OGE financial disclosure
              reports, live market data, and SEC EDGAR filings for Trump-linked
              public companies — not STOCK Act congressional trades.
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <PartyBadge party={profile.party} />
              <span className="status-pill">Executive branch</span>
            </div>
          </div>

          <Button asChild>
            <Link href={`/politician/${profile.id}`}>
              View full profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SpotlightStat
            label="Flagship stock (DJT)"
            value={djtPrice != null ? formatUsd(djtPrice) : "—"}
            sublabel={djtName}
            highlight={isPositive}
            extra={
              djtChange != null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
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
            label="Est. DJT stake"
            value={
              estimatedStakeValue != null
                ? formatCompactUsd(estimatedStakeValue)
                : "—"
            }
            sublabel="~114.75M shares × live price"
          />
          <SpotlightStat
            label="Disclosed items"
            value={String(disclosedPositions)}
            sublabel="OGE holdings & events"
          />
          <SpotlightStat
            label="SEC filings"
            value={String(filingCount)}
            sublabel="DJT & related issuers"
          />
        </div>

        {latestFilings.length > 0 && (
          <section className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Latest SEC filings
              </h3>
              <Link
                href={`/politician/${profile.id}`}
                className="text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {latestFilings.map((filing) => (
                <div
                  key={filing.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary/15 text-[10px] text-primary hover:bg-primary/15">
                        {filing.recencyLabel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {filing.form}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {filing.categoryLabel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{filing.title}</p>
                    <p className="text-xs text-muted-foreground">
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
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <p className="field-label">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
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
