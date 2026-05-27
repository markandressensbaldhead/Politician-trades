import { Badge } from "@/components/ui/badge";
import { InvestmentSummary } from "@/types";
import { cn, formatDate } from "@/lib/utils";

function actionBadgeVariant(
  action: InvestmentSummary["action"]
): "gain" | "loss" | "secondary" {
  if (action === "purchase") return "gain";
  if (action === "sale") return "loss";
  return "secondary";
}

interface InvestmentActivityListProps {
  investments: InvestmentSummary[];
  politicianName: string;
  compact?: boolean;
}

export function InvestmentActivityList({
  investments,
  politicianName,
  compact = false,
}: InvestmentActivityListProps) {
  if (investments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No disclosed investment activity to translate yet for {politicianName}.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {investments.map((investment) => (
        <div
          key={investment.id}
          className={cn(
            "rounded-md border border-border/60 bg-background/30 p-4",
            investment.source === "both" && "border-gain/20"
          )}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={actionBadgeVariant(investment.action)}
                  className="text-[10px]"
                >
                  {investment.actionLabel}
                </Badge>
                {investment.ticker !== "—" && (
                  <Badge variant="outline" className="ticker-symbol text-[10px]">
                    {investment.ticker}
                  </Badge>
                )}
                {investment.sector && (
                  <span className="text-[10px] text-muted-foreground">
                    {investment.sector}
                  </span>
                )}
              </div>

              <p className="text-sm leading-7 text-foreground/95">
                {investment.plainSummary}
              </p>

              {investment.sourceNote && (
                <p className="text-xs text-muted-foreground">
                  {investment.sourceNote}
                </p>
              )}

              {investment.filingContext && (
                <p className="text-xs text-muted-foreground/90">
                  {investment.filingContext}
                </p>
              )}
            </div>

            {!compact && (
              <div className="grid shrink-0 gap-2 sm:grid-cols-3 lg:min-w-[320px]">
                <InvestmentStat
                  label="What"
                  value={investment.asset}
                  sub={investment.ticker}
                />
                <InvestmentStat
                  label="How Much"
                  value={investment.amount ?? "Not stated"}
                />
                <InvestmentStat
                  label="When"
                  value={formatDate(investment.tradeDate)}
                  sub={`Filed ${formatDate(investment.filedDate)}`}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InvestmentStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded border border-border/50 bg-background/40 px-3 py-2">
      <p className="field-label">{label}</p>
      <p className="mt-1 text-sm font-medium leading-snug">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

export function InvestmentSummaryLine({
  investment,
}: {
  investment: InvestmentSummary;
}) {
  return (
    <p className="text-xs leading-6 text-foreground/90">
      <span className="font-medium">{investment.actionLabel}:</span>{" "}
      {investment.amount ?? "Amount undisclosed"} of {investment.asset} (
      {investment.ticker}) on {formatDate(investment.tradeDate)}
    </p>
  );
}
