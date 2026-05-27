import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StateStats } from "@/lib/state-analytics";

interface StateExplorerProps {
  states: StateStats[];
}

export function StateExplorer({ states }: StateExplorerProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {states.map((state) => (
        <Card
          key={state.code}
          className="border-border bg-card transition-colors hover:border-primary/30"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {state.name}
                </CardTitle>
                <CardDescription>{state.code}</CardDescription>
              </div>
              <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {state.politicianCount} members
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2">
                <p className="field-label">Trades</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {state.tradeCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2">
                <p className="field-label">Purchases</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-gain">
                  {state.purchaseCount.toLocaleString()}
                </p>
              </div>
            </div>

            {state.topTickers.length > 0 && (
              <div>
                <p className="field-label">Top tickers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.topTickers.map((ticker) => (
                    <Link
                      key={ticker}
                      href={`/ticker/${ticker}`}
                      className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:border-primary/30 hover:text-primary"
                    >
                      {ticker}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
