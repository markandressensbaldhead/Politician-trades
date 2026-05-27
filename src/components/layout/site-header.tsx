"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Flame,
  Landmark,
  LineChart,
  Search,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: TrendingUp },
  { href: "/feed", label: "Feed", icon: Flame },
  { href: "/search", label: "Search", icon: Search },
  { href: "/politician/donald-trump", label: "Trump", icon: Landmark },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Capitol Trades
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Congressional Stock Tracker
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : href.startsWith("/politician/")
                  ? pathname === href
                  : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <Link
            href="/feed"
            className="ml-1 hidden items-center gap-1 rounded-md border border-terminal-amber/30 bg-terminal-amber/10 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-terminal-amber md:flex"
          >
            <LineChart className="h-3 w-3" />
            Ticker Feed
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/feed" className="hover:text-foreground">
              Live Feed
            </Link>
            <Link href="/search" className="hover:text-foreground">
              Search
            </Link>
            <Link href="/ticker/NVDA" className="hover:text-foreground">
              Example: NVDA
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Data sourced from public financial disclosure filings (STOCK Act).
            Disclosure lag analytics are computed from trade vs filing dates.
            For informational purposes only — not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
