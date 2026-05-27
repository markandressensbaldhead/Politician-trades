export type Party = "Democrat" | "Republican" | "Independent";
export type Chamber = "Senate" | "House" | "Executive";
export type TransactionType = "Purchase" | "Sale";

import type { EdgeTier } from "@/lib/repeatable-edge";

export interface UnifiedCongressTrade {
  id: string;
  politicianId: string;
  politicianName: string;
  party: Party;
  chamber: Chamber;
  ticker: string;
  company: string;
  type: "Purchase" | "Sale";
  amount: string;
  tradeDate: string;
  filingDate: string | null;
  disclosureLagDays: number | null;
  sector: string;
  excessReturn: number | null;
  priceChange?: number | null;
  spyChange?: number | null;
    dataSource?: "unusual_whales" | "quiverquant" | "fmp" | "capitol_trades" | "house_clerk" | "mock";
  uwPoliticianId?: string;
  filingNotes?: string | null;
  isActiveFiling?: boolean;
}

export interface TrendingTickerEntry {
  ticker: string;
  tradeCount: number;
  purchaseCount: number;
  saleCount: number;
  politicianCount: number;
  lastTradeDate: string;
  netFlow: "buying" | "selling" | "mixed";
}

export interface Trade {
  id: string;
  ticker: string;
  company: string;
  type: TransactionType;
  amount: string;
  date: string;
  sector: string;
}

export interface Politician {
  id: string;
  name: string;
  party: Party;
  chamber: Chamber;
  state: string;
  district?: string;
  committee: string;
  totalTrades: number;
  tradesLast90Days: number;
  portfolioValue: number;
  ytdReturn: number;
  returnVsSpy: number;
  winRate: number;
  trades: Trade[];
}

export interface DashboardStats {
  totalPoliticians: number;
  totalTradesYTD: number;
  avgReturn: number;
  topSector: string;
}

export type ChamberFilter = "all" | "senate" | "house";

export interface LeaderboardEntry {
  id: string;
  name: string;
  party: Party;
  chamber: Chamber;
  state: string;
  district?: string;
  tradesLast90Days: number;
  totalTrades?: number;
  returnVsSpy: number;
  edgeScore?: number;
  edgeTier?: EdgeTier;
  edgeWinRate?: number;
  edgeLabel?: string;
  edgeActionHint?: string;
}

export interface SearchPoliticianEntry {
  id: string;
  name: string;
  party: Party;
  chamber: Chamber;
  state: string;
  district?: string;
  committee?: string;
  tradesLast90Days: number;
  totalTrades: number;
  returnVsSpy: number;
  ytdReturn?: number;
  portfolioValue?: number;
  source: "live" | "mock" | "disclosure";
}

export interface ProfileTrade {
  id: string;
  ticker: string;
  company: string;
  type: string;
  amount: string;
  tradeDate: string;
  filingDate: string;
  excessReturn?: number;
  priceChange?: number | null;
  spyChange?: number | null;
  sector?: string;
  disclosureType?: "transaction" | "reported-holding" | "corporate-event";
  sourceNote?: string;
  secFilings?: EdgarFiling[];
  secSyncedAt?: string;
}

export interface TradeSecSnapshot {
  syncedAt: string;
  filings: EdgarFiling[];
  primaryFilingId?: string;
}

export interface PoliticianProfileData {
  id: string;
  bioGuideId?: string;
  name: string;
  party: Party;
  chamber: Chamber;
  state?: string;
  district?: string;
  committee?: string;
  officeTitle?: string;
  source: "live" | "mock" | "disclosure";
  tradesLast90Days: number;
  totalTrades: number;
  returnVsSpy: number;
  winRate?: number;
  portfolioValue?: number;
  trades: ProfileTrade[];
}

export interface MarketQuote {
  ticker: string;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  currency: string;
  shortName: string | null;
}

export type FilingCategory =
  | "material-event"
  | "insider"
  | "periodic"
  | "ownership"
  | "other";

export interface EdgarFiling {
  id: string;
  form: string;
  filedAt: string;
  title: string;
  entityName: string;
  ticker?: string;
  source: "politician-search" | "company-filing";
  documentUrl: string;
  excerpt?: string;
  category: FilingCategory;
  categoryLabel: string;
  daysAgo: number;
  recencyLabel: string;
  priority: number;
  isFeatured?: boolean;
  investmentSummary?: InvestmentSummary;
}

export interface InvestmentSummary {
  id: string;
  ticker: string;
  asset: string;
  action:
    | "purchase"
    | "sale"
    | "holding"
    | "corporate-event"
    | "income"
    | "other";
  actionLabel: string;
  amount: string | null;
  tradeDate: string;
  filedDate: string;
  plainSummary: string;
  filingContext?: string;
  filingIds: string[];
  source: "disclosed-trade" | "sec-filing" | "both";
  sector?: string;
  sourceNote?: string;
}

export interface GroupedFilings {
  category: FilingCategory;
  label: string;
  filings: EdgarFiling[];
}

export interface FilingInsight {
  politicianId: string;
  politicianName: string;
  analysis: string;
  generatedAt: string;
  cached: boolean;
  filingsReviewed: number;
}
