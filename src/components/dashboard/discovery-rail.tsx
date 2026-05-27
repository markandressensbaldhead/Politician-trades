import Link from "next/link";
import {
  ArrowUpRight,
  Layers,
  MapPin,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

import { TradeCluster } from "@/lib/trade-clusters";
import { LeaderboardEntry } from "@/types";
import { TrendingTicker } from "@/lib/trade-analytics";
import { cn, formatPercent } from "@/lib/utils";

interface DiscoveryRailProps {
  topTicker: TrendingTicker | null;
  topPerformer: LeaderboardEntry | null;
  topCluster: TradeCluster | null;
}

export function DiscoveryRail({
  topTicker,
  topPerformer,
  topCluster,
}: DiscoveryRailProps) {
  const cards = [
    topTicker
      ? {
          href: `/ticker/${topTicker.ticker}`,
          icon: TrendingUp,
          eyebrow: "Most traded",
          title: `$${topTicker.ticker}`,
          description: `${topTicker.politicianCount} lawmakers · ${topTicker.tradeCount} trades · ${topTicker.netFlow}`,
          accent: "text-gain",
        }
      : null,
    topCluster
      ? {
          href: `/ticker/${topCluster.ticker}`,
          icon: Layers,
          eyebrow: "Crowd signal",
          title: `${topCluster.politicianCount} on ${topCluster.ticker}`,
          description: topCluster.headline,
          accent: "text-primary",
        }
      : null,
    topPerformer
      ? {
          href: `/politician/${topPerformer.id}`,
          icon: User,
          eyebrow: "Beat the S&P",
          title: topPerformer.name.split(" ").pop() ?? topPerformer.name,
          description: `${formatPercent(topPerformer.returnVsSpy)} vs S&P · ${topPerformer.tradesLast90Days} recent trades`,
          accent: topPerformer.returnVsSpy >= 0 ? "text-gain" : "text-loss",
        }
      : null,
    {
      href: "/portfolio",
      icon: Wallet,
      eyebrow: "Personalized",
      title: "Match your book",
      description:
        "Link Robinhood or paste holdings — see where Congress overlaps your portfolio.",
      accent: "text-primary",
    },
    {
      href: "/states",
      icon: MapPin,
      eyebrow: "Deep dive",
      title: "By state",
      description:
        "Which states generate the most congressional trading flow? Explore the map.",
      accent: "text-muted-foreground",
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: typeof TrendingUp;
    eyebrow: string;
    title: string;
    description: string;
    accent: string;
  }>;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="page-eyebrow">Keep clicking — that&apos;s the point</p>
          <h2 className="text-xl font-semibold sm:text-2xl">
            Where retail starts digging
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Each card is a rabbit hole: ticker flow, crowd signals, top
            performers, and your own overlap. More pages = more edge.
          </p>
        </div>
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View full feed
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {cards.map((card) => (
          <DiscoveryCard key={card.href + card.title} {...card} />
        ))}
      </div>
    </section>
  );
}

function DiscoveryCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  description,
  accent,
}: {
  href: string;
  icon: typeof TrendingUp;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="discovery-card group flex h-full flex-col rounded-xl border border-border bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </span>
        <Icon className={cn("h-4 w-4", accent)} />
      </div>
      <p className={cn("mt-3 text-lg font-semibold tracking-tight", accent)}>
        {title}
      </p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Open
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
