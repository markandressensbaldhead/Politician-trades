export type PortfolioBroker = "robinhood" | "manual" | "other" | "snaptrade";

export interface PortfolioHolding {
  ticker: string;
  quantity: number;
  averageCost?: number | null;
  source: "manual" | "robinhood_csv" | "snaptrade";
}

export interface SavedPortfolio {
  broker: PortfolioBroker;
  holdings: PortfolioHolding[];
  updatedAt: string;
  label?: string;
}

export type PortfolioAdvicePriority = "high" | "medium" | "low";

export type PortfolioAdviceDirection =
  | "Add"
  | "Trim"
  | "Hold"
  | "Watch"
  | "Hedge";

export interface PortfolioOverlapInsight {
  ticker: string;
  yourQuantity: number;
  congressActivity: string;
  note: string;
}

export interface PortfolioOpportunity {
  ticker: string;
  direction: PortfolioAdviceDirection;
  conviction: PortfolioAdvicePriority;
  rationale: string;
  congressSignal: string;
}

export interface PortfolioRiskFlag {
  ticker: string;
  concern: string;
}

export interface PortfolioActionItem {
  priority: PortfolioAdvicePriority;
  action: string;
  rationale: string;
}

export interface PortfolioAdviceContent {
  headline: string;
  portfolioSummary: string;
  overlaps: PortfolioOverlapInsight[];
  opportunities: PortfolioOpportunity[];
  risks: PortfolioRiskFlag[];
  actions: PortfolioActionItem[];
}

export interface PortfolioAdviceResponse {
  advice: PortfolioAdviceContent;
  generatedAt: string;
  holdingsCount: number;
  congressTradesReviewed: number;
}
