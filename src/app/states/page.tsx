import { getAllTrades } from "@/lib/congress-data";
import { getStateStats } from "@/lib/state-analytics";
import { StateExplorer } from "@/components/dashboard/state-explorer";
import { SiteContainer } from "@/components/layout/site-container";

export default async function StatesPage() {
  const { trades, source } = await getAllTrades();
  const states = getStateStats(trades);

  return (
    <SiteContainer>
      <div className="mb-8 space-y-3">
        <p className="page-eyebrow">Geographic view</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Trading activity by state
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          See which states generate the most disclosed congressional trading
          activity — the kind of state-level view research dashboards use when comparing
          regional concentration.
        </p>
        {source === "mock" && (
          <p className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
            State mapping uses sample politician metadata. Connect live data for
            broader coverage.
          </p>
        )}
      </div>

      {states.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No state-level trade data available yet.
        </p>
      ) : (
        <StateExplorer states={states} />
      )}
    </SiteContainer>
  );
}
