import { Badge } from "@/components/ui/badge";
import { SignificanceTier } from "@/lib/trade-significance";
import { cn } from "@/lib/utils";

const tierStyles: Record<
  SignificanceTier,
  { label: string; className: string }
> = {
  high: {
    label: "High signal",
    className: "border-gain/30 bg-gain/10 text-gain",
  },
  medium: {
    label: "Notable",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  low: {
    label: "Routine",
    className: "border-border bg-secondary text-muted-foreground",
  },
};

interface TradeSignificanceBadgeProps {
  tier: SignificanceTier;
  score?: number;
  className?: string;
}

export function TradeSignificanceBadge({
  tier,
  score,
  className,
}: TradeSignificanceBadgeProps) {
  const style = tierStyles[tier];

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", style.className, className)}
      title={score != null ? `Significance score: ${score}/100` : undefined}
    >
      {style.label}
      {score != null && tier !== "low" ? ` · ${score}` : ""}
    </Badge>
  );
}
