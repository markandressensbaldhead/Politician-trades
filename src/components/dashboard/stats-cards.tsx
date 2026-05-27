import { Activity, BarChart2, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/types";
import { formatPercent } from "@/lib/utils";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Tracked Politicians",
      value: stats.totalPoliticians.toString(),
      icon: Users,
      description: "Active disclosure filers",
    },
    {
      title: "Trades YTD",
      value: stats.totalTradesYTD.toString(),
      icon: Activity,
      description: "Reported transactions",
    },
    {
      title: "Avg. Return",
      value: formatPercent(stats.avgReturn),
      icon: TrendingUp,
      description: "Mean portfolio performance",
      highlight: stats.avgReturn >= 0,
    },
    {
      title: "Top Sector",
      value: stats.topSector,
      icon: BarChart2,
      description: "Most traded category",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="border-border/60 bg-card/50 backdrop-blur-sm"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={
                card.highlight !== undefined
                  ? card.highlight
                    ? "text-2xl font-bold tabular-nums text-gain"
                    : "text-2xl font-bold tabular-nums text-loss"
                  : "text-2xl font-bold tabular-nums"
              }
            >
              {card.value}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
