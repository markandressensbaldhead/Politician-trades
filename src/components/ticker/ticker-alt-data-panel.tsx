import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  QuiverGovContract,
  QuiverInsiderTrade,
  QuiverLobbyingRecord,
} from "@/lib/quiver-alt-data";
import { formatDate } from "@/lib/utils";

interface TickerAltDataPanelProps {
  ticker: string;
  insiders: QuiverInsiderTrade[];
  lobbying: QuiverLobbyingRecord[];
  contracts: QuiverGovContract[];
  configured: boolean;
}

function formatMoney(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

export function TickerAltDataPanel({
  ticker,
  insiders,
  lobbying,
  contracts,
  configured,
}: TickerAltDataPanelProps) {
  if (!configured || (insiders.length === 0 && lobbying.length === 0 && contracts.length === 0)) {
    return null;
  }

  return (
    <section className="grid gap-6 xl:grid-cols-3">
      {insiders.length > 0 && (
        <Card className="surface-card overflow-hidden">
          <CardHeader className="surface-header border-b border-border">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                QuiverQuant
              </Badge>
            </div>
            <CardTitle className="text-base">Corporate insider flow</CardTitle>
            <CardDescription>
              Recent Form 4 insider activity on {ticker} — context for Hill
              overlap.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {insiders.slice(0, 5).map((trade, index) => (
              <div key={`${trade.name}-${trade.tradeDate}-${index}`} className="p-4">
                <p className="font-medium">{trade.name}</p>
                <p className="text-xs text-muted-foreground">
                  {trade.transaction} · {formatDate(trade.tradeDate)}
                  {trade.shares ? ` · ${trade.shares.toLocaleString()} sh` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lobbying.length > 0 && (
        <Card className="surface-card overflow-hidden">
          <CardHeader className="surface-header border-b border-border">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                QuiverQuant
              </Badge>
            </div>
            <CardTitle className="text-base">Lobbying spend</CardTitle>
            <CardDescription>
              Corporate lobbying tied to {ticker} — policy overlap signal.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {lobbying.slice(0, 5).map((row, index) => (
              <div key={`${row.client}-${row.year}-${index}`} className="p-4">
                <p className="font-medium">{row.client}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(row.amount)} · {row.year}
                  {row.issue ? ` · ${row.issue}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {contracts.length > 0 && (
        <Card className="surface-card overflow-hidden">
          <CardHeader className="surface-header border-b border-border">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                QuiverQuant
              </Badge>
            </div>
            <CardTitle className="text-base">Government contracts</CardTitle>
            <CardDescription>
              Federal contract awards linked to {ticker}.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {contracts.slice(0, 5).map((row, index) => (
              <div key={`${row.agency}-${row.date}-${index}`} className="p-4">
                <p className="font-medium">{row.agency}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(row.amount)}
                  {row.date ? ` · ${formatDate(row.date)}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{row.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
