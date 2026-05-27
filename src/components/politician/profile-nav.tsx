"use client";

import { cn } from "@/lib/utils";

interface ProfileNavProps {
  hasTrades?: boolean;
  className?: string;
}

export function ProfileNav({ hasTrades = true, className }: ProfileNavProps) {
  const links = [
    ...(hasTrades ? [{ id: "alpha" as const, label: "Summary" }] : []),
    ...(hasTrades ? [{ id: "overview" as const, label: "Overview" }] : []),
    { id: "research" as const, label: "Analysis" },
    { id: "filings" as const, label: "Filings" },
    ...(hasTrades ? [{ id: "trades" as const, label: "Trades" }] : []),
  ];

  return (
    <nav
      className={cn(
        "sticky top-16 z-30 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        className
      )}
      aria-label="Profile sections"
    >
      <div className="flex gap-1 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function ProfileSection({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28", className)}>
      {children}
    </section>
  );
}
