"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Search, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Leaderboard", icon: TrendingUp },
  { href: "/search", label: "Search", icon: Search },
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
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-muted-foreground">
          Data sourced from public financial disclosure filings (STOCK Act).
          For informational purposes only — not investment advice.
        </p>
      </div>
    </footer>
  );
}
