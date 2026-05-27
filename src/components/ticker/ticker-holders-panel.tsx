import Link from "next/link";
import { Briefcase } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UnusualWhalesPortfolioHolder } from "@/lib/unusual-whales";
import { slugify } from "@/lib/quiver-mappers";

interface TickerHoldersPanelProps {
  ticker: string;
  holders: UnusualWhalesPortfolioHolder[];
}

function formatHolderAmount(holder: UnusualWhalesPortfolioHolder): string {
  if (holder.mid_amount != null) {
    return `$${holder.mid_amount.toLocaleString()} est.`;
  }

  if (holder.min_amount != null && holder.max_amount != null) {
    return `$${holder.min_amount.toLocaleString()}–$${holder.max_amount.toLocaleString()}`;
  }

  if (holder.min_amount != null) {
    return `$${holder.min_amount.toLocaleString()}+`;
  }

  return "Position size undisclosed";
}

export function TickerHoldersPanel({ ticker, holders }: TickerHoldersPanelProps) {
  if (holders.length === 0) {
    return null;
  }

  return (
    <Card className="border-sky-500/20 bg-sky-500/[0.03]">
      <CardHeader className="border-b border-border/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 border-sky-500/30 text-[10px]">
            Unusual Whales
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            Current holders
          </Badge>
        </div>
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          Who still holds {ticker}?
        </CardTitle>
        <CardDescription>
          Politicians with an active portfolio position in {ticker}, aggregated
          across disclosed accounts via Unusual Whales.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {holders.map((holder) => {
          const politicianId = slugify(holder.full_name);

          return (
            <div
              key={holder.id}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/politician/${politicianId}`}
                  className="font-medium hover:text-primary"
                >
                  {holder.full_name}
                </Link>
                {holder.owner && holder.owner !== holder.full_name && (
                  <p className="text-xs text-muted-foreground">
                    Account: {holder.owner}
                  </p>
                )}
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatHolderAmount(holder)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
