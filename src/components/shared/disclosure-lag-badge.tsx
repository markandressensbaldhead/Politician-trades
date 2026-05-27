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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        severity === "fast" && "bg-gain/10 text-gain",
        severity === "normal" && "bg-primary/10 text-primary",
        severity === "slow" && "bg-loss/10 text-loss",
        severity === "unknown" && "bg-secondary text-muted-foreground",
        className
      )}
      title={getLagLabel(days)}
    >
      {getLagLabel(days)}
    </span>
  );
}
