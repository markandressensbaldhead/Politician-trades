import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PoliticianLagStats, SectorActivity, OverlapFlag } from "@/lib/trade-analytics";
import { formatDate } from "@/lib/utils";

interface ProfileIntelligenceProps {
  politicianName: string;
  lagStats: PoliticianLagStats;
  sectors: SectorActivity[];
  overlapFlags: OverlapFlag[];
}

export function ProfileIntelligence({
  politicianName,
  lagStats,
  sectors,
  overlapFlags,
}: ProfileIntelligenceProps) {
  const maxSector = sectors[0]?.count ?? 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-terminal-amber">
            Disclosure Transparency
          </CardTitle>
          <CardDescription>
            How fast {politicianName} reports trades after they happen — a metric
            most trackers ignore.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <StatBlock
            label="Median Lag"
            value={
              lagStats.medianLagDays != null
                ? `${lagStats.medianLagDays} days`
                : "—"
            }
          />
          <StatBlock
            label="Fast (&le;30d)"
            value={
              lagStats.medianLagDays != null
                ? `${Math.round(lagStats.fastDisclosureRate * 100)}%`
                : "—"
            }
          />
          <StatBlock
            label="Avg Lag"
            value={
              lagStats.avgLagDays != null ? `${lagStats.avgLagDays} days` : "—"
            }
          />
        </CardContent>
        {lagStats.slowestTrade && (
          <div className="border-t border-border/60 px-6 pb-4 text-xs text-muted-foreground">
            Slowest: {lagStats.slowestTrade.ticker} disclosed after{" "}
            {lagStats.slowestTrade.disclosureLagDays} days (trade{" "}
            {formatDate(lagStats.slowestTrade.tradeDate)})
          </div>
        )}
      </Card>

      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-terminal-amber">
            Sector Footprint
          </CardTitle>
          <CardDescription>
            Where capital is concentrated — useful for spotting committee overlap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sectors.slice(0, 5).map((sector) => (
            <div key={sector.sector}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{sector.sector}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {sector.count} trades · {sector.tickers.join(", ")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-terminal-amber/80"
                  style={{ width: `${(sector.count / maxSector) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {overlapFlags.length > 0 && (
        <Card className="border-terminal-amber/30 bg-terminal-amber/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-[0.18em] text-terminal-amber">
              Oversight Overlap Flags
            </CardTitle>
            <CardDescription>
              Sector activity mapped to typical committee jurisdiction — a
              Capitol Trades exclusive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overlapFlags.map((flag) => (
              <div
                key={`${flag.sector}-${flag.message}`}
                className="rounded-md border border-terminal-amber/20 bg-background/40 p-3 text-sm leading-6"
              >
                <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-terminal-amber">
                  {flag.severity}
                </span>
                {flag.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/30 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
