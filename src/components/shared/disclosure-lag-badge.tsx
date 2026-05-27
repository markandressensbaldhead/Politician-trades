import { cn } from "@/lib/utils";
import { getLagLabel, getLagSeverity } from "@/lib/trade-analytics";

export function DisclosureLagBadge({
  days,
  className,
}: {
  days: number | null;
  className?: string;
}) {
  const severity = getLagSeverity(days);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        severity === "fast" && "border-gain/40 bg-gain/10 text-gain",
        severity === "normal" && "border-terminal-amber/40 bg-terminal-amber/10 text-terminal-amber",
        severity === "slow" && "border-loss/40 bg-loss/10 text-loss",
        severity === "unknown" && "border-border/60 text-muted-foreground",
        className
      )}
      title={getLagLabel(days)}
    >
      {getLagLabel(days)}
    </span>
  );
}
