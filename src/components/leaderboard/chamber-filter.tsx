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
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        Chamber
      </span>
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === filter.value
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:border-border hover:text-foreground"
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
