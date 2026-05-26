export interface CongressTradeRow {
  id: string;
  trade_key: string;
  politician_id: string;
  politician_name: string | null;
  ticker: string;
  trade_type: string;
  amount_range: string | null;
  trade_date: string;
  filing_date: string | null;
  sector: string | null;
  excess_return: number | null;
  created_at: string;
}

export interface PoliticianInsightRow {
  politician_id: string;
  politician_name: string | null;
  analysis: string;
  generated_at: string;
  updated_at: string;
}

export interface PoliticianInsight {
  politicianId: string;
  politicianName: string | null;
  analysis: string;
  generatedAt: string;
  cached: boolean;
}

export interface SubscriptionRow {
  id: string;
  email: string;
  politician_name: string;
  politician_id: string | null;
  created_at: string;
}

export interface NewTradeAlert {
  politicianId: string;
  politicianName: string;
  ticker: string;
  tradeType: "buy" | "sell";
  amountRange: string;
  tradeDate: string;
}
