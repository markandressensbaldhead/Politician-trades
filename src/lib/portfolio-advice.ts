import { getAllTrades } from "@/lib/congress-data";
import { generatePortfolioAdvice, parsePortfolioAdviceJson } from "@/lib/claude";
import { getHighConvictionTrades } from "@/lib/trade-significance";
import { buildClusterIndex, getTradeClusters } from "@/lib/trade-clusters";
import { getTrendingTickers } from "@/lib/trade-analytics";
import { PortfolioAdviceResponse, PortfolioHolding } from "@/types/portfolio";
import { UnifiedCongressTrade } from "@/types";

function formatHoldings(holdings: PortfolioHolding[]): string {
  return holdings
    .map((holding) => {
      const cost =
        holding.averageCost != null
          ? ` · avg cost $${holding.averageCost.toFixed(2)}`
          : "";
      return `- ${holding.ticker}: ${holding.quantity} shares${cost}`;
    })
    .join("\n");
}

function getPortfolioTickers(holdings: PortfolioHolding[]): Set<string> {
  return new Set(holdings.map((holding) => holding.ticker.toUpperCase()));
}

function formatCongressContext(
  trades: UnifiedCongressTrade[],
  userTickers: Set<string>
): string {
  const clusters = getTradeClusters(trades, {
    days: 30,
    minPoliticians: 2,
    limit: 8,
  });
  const clusterIndex = buildClusterIndex(clusters);
  const highConviction = getHighConvictionTrades(trades, 10, clusterIndex);
  const trending = getTrendingTickers(trades, 8);

  const overlapTrades = trades
    .filter((trade) => userTickers.has(trade.ticker.toUpperCase()))
    .slice(0, 25);

  const nonOverlapIdeas = highConviction
    .filter((trade) => !userTickers.has(trade.ticker.toUpperCase()))
    .slice(0, 8);

  const overlapLines =
    overlapTrades.length > 0
      ? overlapTrades
          .map(
            (trade) =>
              `- ${trade.ticker} · ${trade.type} · ${trade.politicianName} · ${trade.amount} · filed ${trade.filingDate ?? trade.tradeDate}`
          )
          .join("\n")
      : "No direct ticker overlap in recent disclosures.";

  const clusterLines =
    clusters.length > 0
      ? clusters
          .map(
            (cluster) =>
              `- ${cluster.ticker}: ${cluster.politicianCount} members, ${cluster.tradeCount} trades (${cluster.netFlow})`
          )
          .join("\n")
      : "No multi-member clusters in the last 30 days.";

  const ideaLines =
    nonOverlapIdeas.length > 0
      ? nonOverlapIdeas
          .map(
            (trade) =>
              `- ${trade.ticker} · ${trade.type} · ${trade.politicianName} · score ${trade.significanceScore} · ${trade.significanceReasons.join(", ")}`
          )
          .join("\n")
      : "No high-conviction non-overlap ideas available.";

  const trendingLines = trending
    .map(
      (entry) =>
        `- ${entry.ticker}: ${entry.tradeCount} trades, ${entry.politicianCount} members (${entry.netFlow})`
    )
    .join("\n");

  return `USER PORTFOLIO TICKERS: ${[...userTickers].join(", ") || "none"}

CONGRESSIONAL TRADES IN USER HOLDINGS (recent):
${overlapLines}

MULTI-MEMBER CLUSTERS (30d):
${clusterLines}

HIGH-CONVICTION CONGRESS FLOW NOT IN USER PORTFOLIO:
${ideaLines}

TRENDING CONGRESS TICKERS (90d):
${trendingLines}`;
}

export async function buildPortfolioAdvice(
  holdings: PortfolioHolding[]
): Promise<PortfolioAdviceResponse> {
  if (holdings.length === 0) {
    throw new Error("Add at least one holding before requesting advice.");
  }

  const { trades } = await getAllTrades();
  const userTickers = getPortfolioTickers(holdings);
  const congressContext = formatCongressContext(trades, userTickers);
  const holdingsText = formatHoldings(holdings);

  const raw = await generatePortfolioAdvice({
    holdingsText,
    congressContext,
    holdingsCount: holdings.length,
  });

  const advice = parsePortfolioAdviceJson(raw);

  return {
    advice,
    generatedAt: new Date().toISOString(),
    holdingsCount: holdings.length,
    congressTradesReviewed: trades.length,
  };
}
