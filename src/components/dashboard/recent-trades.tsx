import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface RecentTrade {
  id: string;
  ticker: string;
  company: string;
  type: "Purchase" | "Sale";
  amount: string;
  date: string;
  sector: string;
  politicianId: string;
  politicianName: string;
  party: string;
}

interface RecentTradesProps {
  trades: RecentTrade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>
          Latest reported transactions on {BRAND.hill}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Politician</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(trade.date)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/politician/${trade.politicianId}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {trade.politicianName}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="ticker-symbol">{trade.ticker}</span>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {trade.company}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={trade.type === "Purchase" ? "gain" : "loss"}
                  >
                    {trade.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {trade.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
