"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Landmark, Search, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: TrendingUp },
  { href: "/feed", label: "Trades", icon: BarChart3 },
  { href: "/search", label: "Search", icon: Search },
  { href: "/politician/donald-trump", label: "Trump", icon: Landmark },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight">
              Capitol Trades
            </span>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Congressional stock disclosures
            </p>
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
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
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
    <footer className="mt-auto border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/feed" className="hover:text-foreground">
              Recent trades
            </Link>
            <Link href="/search" className="hover:text-foreground">
              Search
            </Link>
            <Link href="/ticker/NVDA" className="hover:text-foreground">
              Stock lookup
            </Link>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Data comes from public financial disclosure filings required by the
            STOCK Act. This site is for research and education only — not
            investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
