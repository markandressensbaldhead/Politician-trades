import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PortfolioCtaBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card px-6 py-8 sm:px-8">
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Portfolio overlap check
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Already hold what Congress just bought?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Link Robinhood, import a CSV, or type your tickers. We&apos;ll show
            where your book overlaps Capitol flow — and where you&apos;re missing
            the signal entirely.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12">
            <Link href="/portfolio">
              Check my overlap
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12">
            <Link href="/search">Search a ticker</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
