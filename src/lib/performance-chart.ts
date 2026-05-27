import { formatDate } from "@/lib/utils";

export interface PerformanceTradeInput {
  tradeDate: string;
  type: string;
  excessReturn?: number | null;
  priceChange?: number | null;
  spyChange?: number | null;
}

export interface PerformancePoint {
  date: string;
  label: string;
  portfolioCumulative: number;
  spyCumulative: number;
  excessCumulative: number;
}

export interface PerformanceSummary {
  points: PerformancePoint[];
  totalExcessVsSpy: number;
  totalPortfolioReturn: number;
  totalSpyReturn: number;
  tradesWithData: number;
  hasSpyBenchmark: boolean;
}

function contribution(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

export function buildPerformanceSeries(
  trades: PerformanceTradeInput[]
): PerformanceSummary {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
  );

  let portfolioCumulative = 0;
  let spyCumulative = 0;
  let excessCumulative = 0;
  let tradesWithData = 0;
  let hasSpyBenchmark = false;

  const points: PerformancePoint[] = [
    {
      date: sorted[0]?.tradeDate ?? new Date().toISOString().slice(0, 10),
      label: "Start",
      portfolioCumulative: 0,
      spyCumulative: 0,
      excessCumulative: 0,
    },
  ];

  for (const trade of sorted) {
    const priceMove = contribution(trade.priceChange);
    const spyMove = contribution(trade.spyChange);
    const excessMove = contribution(trade.excessReturn);

    if (priceMove !== 0 || spyMove !== 0 || excessMove !== 0) {
      tradesWithData += 1;
    }

    if (trade.spyChange != null) {
      hasSpyBenchmark = true;
    }

    if (priceMove !== 0 || spyMove !== 0) {
      portfolioCumulative += priceMove;
      spyCumulative += spyMove;
      excessCumulative += priceMove - spyMove;
    } else if (excessMove !== 0) {
      portfolioCumulative += excessMove;
      excessCumulative += excessMove;
    }

    points.push({
      date: trade.tradeDate,
      label: formatDate(trade.tradeDate),
      portfolioCumulative: round(portfolioCumulative),
      spyCumulative: round(spyCumulative),
      excessCumulative: round(excessCumulative),
    });
  }

  return {
    points,
    totalExcessVsSpy: round(excessCumulative),
    totalPortfolioReturn: round(portfolioCumulative),
    totalSpyReturn: round(spyCumulative),
    tradesWithData,
    hasSpyBenchmark,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getChartBounds(points: PerformancePoint[]): {
  minY: number;
  maxY: number;
} {
  const values = points.flatMap((point) => [
    point.portfolioCumulative,
    point.spyCumulative,
    point.excessCumulative,
  ]);

  const minY = Math.min(0, ...values);
  const maxY = Math.max(0, ...values);
  const padding = Math.max(2, (maxY - minY) * 0.12);

  return {
    minY: minY - padding,
    maxY: maxY + padding,
  };
}

export function pointToSvg(
  index: number,
  value: number,
  total: number,
  minY: number,
  maxY: number,
  width: number,
  height: number
): { x: number; y: number } {
  const x = total <= 1 ? width / 2 : (index / (total - 1)) * width;
  const range = maxY - minY || 1;
  const y = height - ((value - minY) / range) * height;

  return { x, y };
}

export function buildSvgPath(
  points: PerformancePoint[],
  key: "portfolioCumulative" | "spyCumulative" | "excessCumulative",
  width: number,
  height: number,
  minY: number,
  maxY: number
): string {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => {
      const { x, y } = pointToSvg(
        index,
        point[key],
        points.length,
        minY,
        maxY,
        width,
        height
      );

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
