import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  MessageCircle,
  Radio,
  Users,
} from "lucide-react";

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
  buildXProfileUrl,
  getCuratedAccountsByCategory,
  XTopicalItem,
} from "@/lib/x-news";
import { formatRelativeTime } from "@/lib/utils";

interface XNewsPanelProps {
  topical: XTopicalItem[];
}

export function XNewsPanel({ topical }: XNewsPanelProps) {
  const categories = getCuratedAccountsByCategory();

  return (
    <section id="x-news" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-sm font-bold text-background">
              X
            </span>
            <p className="page-eyebrow">FinX pulse</p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What X is saying about Capitol trades
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Topical searches and accounts that break congressional trading
            stories — cross-check every post against our filing data before you
            act.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link
            href="https://x.com/search?q=congress%20stock%20trades&f=live"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Radio className="mr-2 h-4 w-4" />
            Live X search
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="surface-card overflow-hidden">
          <CardHeader className="surface-header border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-4 w-4 text-primary" />
              Topical right now
            </CardTitle>
            <CardDescription>
              Generated from today&apos;s signals — each card links to our data
              and the live X conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {topical.map((item) => (
              <TopicalRow key={item.id} item={item} />
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card overflow-hidden">
          <CardHeader className="surface-header border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 text-primary" />
              Accounts that cover this
            </CardTitle>
            <CardDescription>
              Major X voices on congressional trading, investigations, and
              retail market news.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            {categories.map((group) => (
              <div key={group.category} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">{group.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <div className="space-y-2">
                  {group.accounts.map((account) => (
                    <Link
                      key={account.id}
                      href={buildXProfileUrl(account.handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                        {account.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium group-hover:text-primary">
                            {account.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{account.handle}
                          </span>
                          {account.followersLabel && (
                            <Badge variant="outline" className="text-[10px]">
                              {account.followersLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {account.whyFollow}
                        </p>
                      </div>
                      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function TopicalRow({ item }: { item: XTopicalItem }) {
  return (
    <article className="flex flex-col gap-4 p-5 transition-colors hover:bg-secondary/15 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {item.badge}
          </Badge>
          {item.ticker && (
            <Link
              href={`/ticker/${item.ticker}`}
              className="ticker-symbol text-sm hover:text-primary"
            >
              ${item.ticker}
            </Link>
          )}
          {item.timestamp && (
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(item.timestamp)}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold leading-snug">{item.headline}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.summary}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {item.relatedHandles.map((handle) => (
            <Link
              key={handle}
              href={buildXProfileUrl(handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              @{handle}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
        <Button asChild size="sm" variant="default">
          <Link href={item.internalUrl}>
            Our data
            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link
            href={item.xSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            See on X
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
