import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PoliticianLagStats,
  SectorActivity,
  OverlapFlag,
} from "@/lib/trade-analytics";
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
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            Disclosure Transparency
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            How quickly {politicianName} reports trades after they happen.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <StatBlock
            label="Median lag"
            value={
              lagStats.medianLagDays != null
                ? `${lagStats.medianLagDays} days`
                : "—"
            }
          />
          <StatBlock
            label="Fast (≤30d)"
            value={
              lagStats.medianLagDays != null
                ? `${Math.round(lagStats.fastDisclosureRate * 100)}%`
                : "—"
            }
          />
          <StatBlock
            label="Avg lag"
            value={
              lagStats.avgLagDays != null ? `${lagStats.avgLagDays} days` : "—"
            }
          />
        </CardContent>
        {lagStats.slowestTrade && (
          <div className="border-t border-border/60 px-6 pb-4 pt-3 text-xs leading-relaxed text-muted-foreground">
            Slowest: {lagStats.slowestTrade.ticker} disclosed after{" "}
            {lagStats.slowestTrade.disclosureLagDays} days (trade{" "}
            {formatDate(lagStats.slowestTrade.tradeDate)})
          </div>
        )}
      </Card>

      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            Sector Footprint
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Where capital is concentrated across disclosed trades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectors.slice(0, 5).map((sector) => (
            <div key={sector.sector}>
              <div className="mb-2 flex items-start justify-between gap-3 text-sm">
                <span className="font-medium">{sector.sector}</span>
                <span className="shrink-0 text-right text-xs text-muted-foreground">
                  {sector.count} trades
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(sector.count / maxSector) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {sector.tickers.join(", ")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {overlapFlags.length > 0 && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Oversight Overlap Flags
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Sector activity mapped to typical committee jurisdiction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overlapFlags.map((flag) => (
              <div
                key={`${flag.sector}-${flag.message}`}
                className="rounded-lg border border-border bg-background/40 p-3.5 text-sm leading-7"
              >
                <span className="mb-1 mr-2 inline-flex rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
    <div className="rounded-lg border border-border/60 bg-background/30 px-3 py-3">
      <p className="field-label">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
