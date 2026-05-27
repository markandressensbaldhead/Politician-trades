"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Landmark,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import { ShareOnXButton } from "@/components/shared/share-on-x-button";
import { Button } from "@/components/ui/button";
import { BRAND, COPY } from "@/lib/brand";
import { buildSiteTweet, SITE_URL } from "@/lib/share";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#trade-of-day", label: "Hill pick", icon: Target },
  { href: "/feed", label: "Trades", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/search", label: "Search", icon: Search },
  { href: "/states", label: "States", icon: MapPin },
  { href: "/#x-news", label: "X Pulse", icon: MessageCircle },
];

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
  compact = false,
}: {
  href: string;
  label: string;
  icon: typeof Target;
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const isActive = href.startsWith("/#")
    ? pathname === "/"
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        compact && "w-full",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function SiteHeader({ deprecated = false }: { deprecated?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (deprecated) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="layout-shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="text-base font-semibold tracking-tight">
                {BRAND.name}
              </span>
              <p className="truncate text-xs text-muted-foreground">Retired</p>
            </div>
          </Link>
          <Link
            href="mailto:contact@tradethehill.org"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="layout-shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="text-base font-semibold tracking-tight">
              {BRAND.name}
            </span>
            <p className="truncate text-xs text-muted-foreground">
              {BRAND.shortTagline}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} pathname={pathname} {...item} />
          ))}
          <NavLink
            href="/politician/donald-trump"
            label="Trump"
            icon={Landmark}
            pathname={pathname}
          />
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ShareOnXButton
            text={buildSiteTweet(SITE_URL)}
            url={SITE_URL}
            size="sm"
            variant="ghost"
            className="hidden xl:inline-flex"
            label="Share"
          />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/#trade-of-day">Today&apos;s {COPY.hillPick}</Link>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="lg:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/80 bg-background/95 lg:hidden">
          <nav className="layout-shell flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                pathname={pathname}
                compact
                onNavigate={() => setMobileOpen(false)}
                {...item}
              />
            ))}
            <NavLink
              href="/politician/donald-trump"
              label="Trump disclosures"
              icon={Landmark}
              pathname={pathname}
              compact
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-4">
              <Button asChild className="w-full">
                <Link href="/#trade-of-day" onClick={() => setMobileOpen(false)}>
                  Today&apos;s {COPY.hillPick}
                </Link>
              </Button>
              <ShareOnXButton
                text={buildSiteTweet(SITE_URL)}
                url={SITE_URL}
                className="w-full"
                label="Share on X"
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter({ deprecated = false }: { deprecated?: boolean }) {
  if (deprecated) {
    return (
      <footer className="mt-auto w-full border-t border-border/80 bg-card/40">
        <div className="layout-shell py-10 text-center text-sm text-muted-foreground">
          <p>{BRAND.name} was retired in May 2026. Not investment advice.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto w-full border-t border-border/80 bg-card/40">
      <div className="layout-shell py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
          <div className="space-y-4">
            <p className="text-xl font-semibold tracking-tight sm:text-2xl">
              {COPY.footerHeadline}
            </p>
            <p className="prose-muted max-w-lg">{COPY.footerSub}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <ShareOnXButton
                text={buildSiteTweet(SITE_URL)}
                url={SITE_URL}
                label="Share on X"
              />
              <Button asChild variant="outline" size="sm">
                <Link href="/#trade-of-day">Today&apos;s {COPY.hillPick}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/portfolio">Portfolio check</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Explore
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/feed" className="text-muted-foreground hover:text-foreground">
                  All trades
                </Link>
                <Link href="/search" className="text-muted-foreground hover:text-foreground">
                  Search members
                </Link>
                <Link href="/states" className="text-muted-foreground hover:text-foreground">
                  By state
                </Link>
                <Link href="/ticker/NVDA" className="text-muted-foreground hover:text-foreground">
                  Ticker lookup
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Signals
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/#trade-of-day" className="text-muted-foreground hover:text-foreground">
                  Today&apos;s pick
                </Link>
                <Link href="/#x-news" className="text-muted-foreground hover:text-foreground">
                  X pulse
                </Link>
                <Link href="/portfolio" className="text-muted-foreground hover:text-foreground">
                  Match portfolio
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t border-border/60 pt-8 text-xs leading-relaxed text-muted-foreground">
          <p>{COPY.disclosureDisclaimer}</p>
          <p>
            Data from Unusual Whales, FMP, QuiverQuant, Capitol Trades, and
            official House Clerk filings.
          </p>
        </div>
      </div>
    </footer>
  );
}
