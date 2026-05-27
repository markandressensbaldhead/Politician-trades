import { Badge } from "@/components/ui/badge";
import { EdgeTier } from "@/lib/repeatable-edge";
import { cn } from "@/lib/utils";

const tierStyles: Record<
  EdgeTier,
  { label: string; className: string }
> = {
  proven: {
    label: "Repeatable edge",
    className: "border-gain/30 bg-gain/10 text-gain",
  },
  promising: {
    label: "Building edge",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  inconsistent: {
    label: "Mixed record",
    className: "border-border bg-secondary text-muted-foreground",
  },
  cosplay: {
    label: "Cosplay risk",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  insufficient: {
    label: "Thin sample",
    className: "border-border bg-secondary/60 text-muted-foreground",
  },
};

interface EdgeTierBadgeProps {
  tier: EdgeTier;
  score?: number;
  className?: string;
  compact?: boolean;
}

export function EdgeTierBadge({
  tier,
  score,
  className,
  compact = false,
}: EdgeTierBadgeProps) {
  const style = tierStyles[tier];

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", style.className, className)}
    >
      {compact ? style.label : `${style.label}${score != null ? ` · ${score}` : ""}`}
    </Badge>
  );
}
