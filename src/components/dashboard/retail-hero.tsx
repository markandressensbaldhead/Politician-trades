import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
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
}: RetailHeroProps) {
  const lastName = topPerformerName.split(" ").pop() ?? topPerformerName;

  return (
    <section className="hero-mesh relative overflow-hidden rounded-2xl border border-border/80 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill status-pill-live gap-1.5">
              <span className="live-dot animate-pulse" />
              {isLive ? "Live disclosures" : "Demo mode"}
            </span>
            <span className="status-pill">Free · No login</span>
            <span className="status-pill">STOCK Act data</span>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Congress trades stocks.
              <span className="block text-primary">Now you can see every buy.</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Lawmakers file every trade by law — but the data is buried in PDFs.
              We turn it into a retail-ready feed: who bought, how much, and
              whether it beat the S&amp;P. Your edge is speed, not insider access.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link href="#trade-of-day">
                See today&apos;s pick
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link href="/feed">Browse all trades</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link href="/portfolio">
                <Sparkles className="mr-2 h-4 w-4" />
                Match my portfolio
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Research tool only — not financial advice. Public filings, updated as
            they sync.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <HeroStat
            label="Congress vs S&P (90d avg)"
            value={formatPercent(avgReturnVsSpy)}
            positive={avgReturnVsSpy >= 0}
            icon={TrendingUp}
            highlight
          />
          <HeroStat
            label="Hottest ticker right now"
            value={topTicker ? `$${topTicker}` : "—"}
            sub={`${tradeCount90d} trades · ${memberCount} members tracked`}
            href={topTicker ? `/ticker/${topTicker}` : undefined}
          />
          <HeroStat
            label="Best performer to copy-study"
            value={lastName}
            sub={`${formatPercent(topPerformerReturn)} vs S&P`}
            positive={topPerformerReturn >= 0}
            href={`/politician/${topPerformerId}`}
          />
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Built for retail deployers</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  One page for today&apos;s signal, one click to the ticker, one
                  alert when Congress moves again. Share the daily pick — that&apos;s
                  the whole story.
                </p>
              </div>
            </div>
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
        "rounded-xl border border-border/80 bg-background/50 p-4 transition-colors",
        href && "hover:border-primary/30 hover:bg-primary/[0.03]"
      )}
    >
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums tracking-tight",
            highlight && "text-primary",
            positive === true && "text-gain",
            positive === false && "text-loss"
          )}
        >
          {value}
        </p>
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
