import { buildClusterIndex, getTradeClusters } from "@/lib/trade-clusters";
import { buildPoliticianMetadataIndex } from "@/lib/politician-metadata";
import { getHighConvictionTrades } from "@/lib/trade-significance";
import { getTrendingTickers } from "@/lib/trade-analytics";
import { PortfolioHolding } from "@/types/portfolio";
import { UnifiedCongressTrade } from "@/types";

export interface PortfolioOverlapTrade {
  ticker: string;
  type: UnifiedCongressTrade["type"];
  politicianName: string;
  politicianId: string;
  amount: string;
  filingDate: string;
  excessReturn: number | null;
  significanceScore?: number;
}

export interface PortfolioCongressSignals {
  overlapTrades: PortfolioOverlapTrade[];
  overlapTickers: string[];
  missingClusters: Array<{
    ticker: string;
    politicianCount: number;
    netFlow: string;
    headline: string;
  }>;
  highConvictionIdeas: Array<{
    ticker: string;
    type: UnifiedCongressTrade["type"];
    politicianName: string;
    headline: string;
    score: number;
  }>;
  trendingNotHeld: Array<{
    ticker: string;
    tradeCount: number;
    politicianCount: number;
    netFlow: string;
  }>;
  summary: string;
}

export function getPortfolioCongressSignals(
  holdings: PortfolioHolding[],
  trades: UnifiedCongressTrade[]
): PortfolioCongressSignals {
  const userTickers = new Set(
    holdings.map((holding) => holding.ticker.toUpperCase())
  );

  const clusters = getTradeClusters(trades, {
    days: 30,
    minPoliticians: 2,
    limit: 10,
  });
  const clusterIndex = buildClusterIndex(clusters);
  const politicianIndex = buildPoliticianMetadataIndex(trades);
  const highConviction = getHighConvictionTrades(trades, 8, clusterIndex, {
    days: 90,
    diversify: true,
    politicianIndex,
  });
  const trending = getTrendingTickers(trades, 10);

  const overlapTrades = trades
    .filter((trade) => userTickers.has(trade.ticker.toUpperCase()))
    .sort(
      (a, b) =>
        new Date(b.filingDate ?? b.tradeDate).getTime() -
        new Date(a.filingDate ?? a.tradeDate).getTime()
    )
    .slice(0, 12)
    .map((trade) => ({
      ticker: trade.ticker,
      type: trade.type,
      politicianName: trade.politicianName,
      politicianId: trade.politicianId,
      amount: trade.amount,
      filingDate: trade.filingDate ?? trade.tradeDate,
      excessReturn: trade.excessReturn,
    }));

  const overlapTickers = [...userTickers].filter((ticker) =>
    overlapTrades.some((trade) => trade.ticker === ticker)
  );

  const missingClusters = clusters
    .filter((cluster) => !userTickers.has(cluster.ticker.toUpperCase()))
    .slice(0, 4)
    .map((cluster) => ({
      ticker: cluster.ticker,
      politicianCount: cluster.politicianCount,
      netFlow: cluster.netFlow,
      headline: cluster.headline,
    }));

  const highConvictionIdeas = highConviction
    .filter((trade) => !userTickers.has(trade.ticker.toUpperCase()))
    .slice(0, 5)
    .map((trade) => ({
      ticker: trade.ticker,
      type: trade.type,
      politicianName: trade.politicianName,
      headline: trade.headline,
      score: trade.significanceScore,
    }));

  const trendingNotHeld = trending
    .filter((entry) => !userTickers.has(entry.ticker.toUpperCase()))
    .slice(0, 5)
    .map((entry) => ({
      ticker: entry.ticker,
      tradeCount: entry.tradeCount,
      politicianCount: entry.politicianCount,
      netFlow: entry.netFlow,
    }));

  let summary = "No recent congressional activity in your holdings.";
  if (overlapTrades.length > 0 && missingClusters.length > 0) {
    summary = `You hold ${overlapTickers.length} ticker${overlapTickers.length !== 1 ? "s" : ""} with recent Capitol flow, but you're missing ${missingClusters.length} crowd signal${missingClusters.length !== 1 ? "s" : ""} lawmakers are chasing.`;
  } else if (overlapTrades.length > 0) {
    summary = `${overlapTrades.length} recent congressional trade${overlapTrades.length !== 1 ? "s" : ""} overlap your book — review direction (buy vs sell) before sizing.`;
  } else if (missingClusters.length > 0) {
    summary = `No overlap yet, but ${missingClusters.length} multi-member cluster${missingClusters.length !== 1 ? "s" : ""} are active in names you don't hold.`;
  }

  return {
    overlapTrades,
    overlapTickers,
    missingClusters,
    highConvictionIdeas,
    trendingNotHeld,
    summary,
  };
}
