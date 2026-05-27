export type Party = "Democrat" | "Republican" | "Independent";
export type Chamber = "Senate" | "House" | "Executive";
export type TransactionType = "Purchase" | "Sale";

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
  sector?: string;
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
}

export interface FilingInsight {
  politicianId: string;
  politicianName: string;
  analysis: string;
  generatedAt: string;
  cached: boolean;
  filingsReviewed: number;
}
