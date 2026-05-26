export type Party = "Democrat" | "Republican" | "Independent";
export type Chamber = "Senate" | "House";
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
  returnVsSpy: number;
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
  source: "live" | "mock";
  tradesLast90Days: number;
  totalTrades: number;
  returnVsSpy: number;
  winRate?: number;
  portfolioValue?: number;
  trades: ProfileTrade[];
}
