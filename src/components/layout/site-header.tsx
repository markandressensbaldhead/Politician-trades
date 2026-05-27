"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Landmark,
  MapPin,
  MessageCircle,
  Search,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { ShareOnXButton } from "@/components/shared/share-on-x-button";
import { Button } from "@/components/ui/button";
import { BRAND, COPY } from "@/lib/brand";
import { buildSiteTweet, SITE_URL } from "@/lib/share";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#trade-of-day", label: "Hill pick", icon: Target },
  { href: "/#x-news", label: "X Pulse", icon: MessageCircle },
  { href: "/feed", label: "Trades", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/search", label: "Search", icon: Search },
  { href: "/states", label: "States", icon: MapPin },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-semibold tracking-tight">
              {BRAND.name}
            </span>
            <p className="truncate text-xs text-muted-foreground sm:block">
              {BRAND.tagline} · Free
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href.startsWith("/#")
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <Link
            href="/politician/donald-trump"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/politician/donald-trump"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            <Landmark className="h-4 w-4" />
            Trump
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ShareOnXButton
            text={buildSiteTweet(SITE_URL)}
            url={SITE_URL}
            size="sm"
            variant="ghost"
            className="hidden lg:inline-flex"
            label="Share"
          />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/#trade-of-day">Today&apos;s {COPY.hillPick}</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="sm:hidden">
            <Link href="/feed">Trades</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {COPY.footerHeadline}
            </p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {COPY.footerSub}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <ShareOnXButton
              text={buildSiteTweet(SITE_URL)}
              url={SITE_URL}
              label="Share on X"
            />
            <Button asChild variant="outline">
              <Link href="/#trade-of-day">Today&apos;s {COPY.hillPick}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/portfolio">Portfolio check</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/#x-news" className="hover:text-foreground">
              X pulse
            </Link>
            <Link href="/feed" className="hover:text-foreground">
              All trades
            </Link>
            <Link href="/search" className="hover:text-foreground">
              Search
            </Link>
            <Link href="/states" className="hover:text-foreground">
              By state
            </Link>
            <Link href="/ticker/NVDA" className="hover:text-foreground">
              Ticker lookup
            </Link>
          </div>

          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {COPY.disclosureDisclaimer}
          </p>
          <p className="text-xs text-muted-foreground">
            Live disclosures via Unusual Whales, FMP, QuiverQuant, Capitol Trades,
            and official House Clerk PTR filings.
          </p>
        </div>
      </div>
    </footer>
  );
}
