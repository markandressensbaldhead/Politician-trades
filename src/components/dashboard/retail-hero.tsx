import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";

import { NextDisclosureSync } from "@/components/shared/next-disclosure-sync";
import { DataSourceBadge } from "@/components/shared/data-source-badge";
import { Button } from "@/components/ui/button";
import { BRAND, COPY } from "@/lib/brand";
import type { CongressDataProvider } from "@/lib/congress-trade-source";
import { cn, formatPercent } from "@/lib/utils";

interface RetailHeroProps {
  avgReturnVsSpy: number;
  topPerformerId: string;
  topPerformerName: string;
  topPerformerReturn: number;
  topTicker: string | null;
  tradeCount90d: number;
  memberCount: number;
  isLive: boolean;
  dataProvider?: CongressDataProvider;
}

export function RetailHero({
  avgReturnVsSpy,
  topPerformerId,
  topPerformerName,
  topPerformerReturn,
  topTicker,
  tradeCount90d,
  memberCount,
  isLive,
  dataProvider = "none",
}: RetailHeroProps) {
  const lastName = topPerformerName.split(" ").pop() ?? topPerformerName;

  return (
    <section className="hero-mesh relative overflow-hidden rounded-2xl border border-border/80 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill status-pill-live gap-2">
              <span className="live-dot animate-pulse" />
              {isLive ? "Live disclosures" : "Demo mode"}
            </span>
            {isLive && <NextDisclosureSync variant="pill" />}
            {dataProvider !== "none" && (
              <DataSourceBadge provider={dataProvider} />
            )}
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {COPY.heroHeadline}
              <span className="mt-2 block text-primary">{COPY.heroSubhead}</span>
            </h1>
            <p className="max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8">
              {COPY.heroBody}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="#trade-of-day">
                {COPY.heroCtaPrimary}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <Link href="/feed">{COPY.heroCtaSecondary}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-11 px-6">
              <Link href="/portfolio">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Match my portfolio
              </Link>
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Research only — not financial advice. {COPY.nextDisclosureSync}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <HeroStat
            label={COPY.heroStatCongress}
            value={formatPercent(avgReturnVsSpy)}
            positive={avgReturnVsSpy >= 0}
            icon={TrendingUp}
            highlight
          />
          <HeroStat
            label="Hottest ticker"
            value={topTicker ? `$${topTicker}` : "—"}
            sub={`${tradeCount90d} trades · ${memberCount} members`}
            href={topTicker ? `/ticker/${topTicker}` : undefined}
          />
          <HeroStat
            label="Top copy-study"
            value={lastName}
            sub={`${formatPercent(topPerformerReturn)} vs S&P`}
            positive={topPerformerReturn >= 0}
            href={topPerformerId ? `/politician/${topPerformerId}` : undefined}
          />
          <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold">Built for retail on {BRAND.hill}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {COPY.heroRetailBlurb}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  sub,
  positive,
  highlight,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  highlight?: boolean;
  href?: string;
  icon?: typeof TrendingUp;
}) {
  const content = (
    <div
      className={cn(
        "h-full rounded-xl border border-border/70 bg-background/60 p-5 transition-colors",
        href && "hover:border-primary/25 hover:bg-primary/[0.04]"
      )}
    >
      <p className="metric-label">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <p
          className={cn(
            "metric-value",
            highlight && "text-primary",
            positive === true && "text-gain",
            positive === false && "text-loss"
          )}
        >
          {value}
        </p>
      </div>
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
