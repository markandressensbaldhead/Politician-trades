import { Badge } from "@/components/ui/badge";
import type { CongressDataProvider } from "@/lib/congress-trade-source";
import { getProviderLabel } from "@/lib/data-provider";
import { cn } from "@/lib/utils";

interface DataSourceBadgeProps {
  provider: CongressDataProvider;
  className?: string;
}

export function DataSourceBadge({ provider, className }: DataSourceBadgeProps) {
  if (provider === "none") {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium",
        provider === "unusual_whales" && "border-sky-500/30 text-sky-600 dark:text-sky-400",
        provider === "fmp" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        provider === "mixed" && "border-violet-500/30 text-violet-600 dark:text-violet-400",
        className
      )}
    >
      {getProviderLabel(provider)}
    </Badge>
  );
}
