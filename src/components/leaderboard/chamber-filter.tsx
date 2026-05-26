"use client";

import { ChamberFilter } from "@/types";
import { cn } from "@/lib/utils";

interface ChamberFilterBarProps {
  value: ChamberFilter;
  onChange: (value: ChamberFilter) => void;
  counts: Record<ChamberFilter, number>;
}

const filters: { value: ChamberFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "senate", label: "Senate" },
  { value: "house", label: "House" },
];

export function ChamberFilterBar({
  value,
  onChange,
  counts,
}: ChamberFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-terminal-amber">
        Filter
      </span>
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={cn(
            "rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all",
            value === filter.value
              ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_16px_rgba(34,197,94,0.12)]"
              : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          {filter.label}
          <span className="ml-1.5 text-[10px] text-muted-foreground">
            ({counts[filter.value]})
          </span>
        </button>
      ))}
    </div>
  );
}
