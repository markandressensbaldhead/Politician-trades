import { DashboardStats, Politician } from "@/types";

export const politicians: Politician[] = [
  {
    id: "nancy-pelosi",
    name: "Nancy Pelosi",
    party: "Democrat",
    chamber: "House",
    state: "CA",
    district: "11",
    committee: "Financial Services",
    totalTrades: 47,
    tradesLast90Days: 18,
    portfolioValue: 28400000,
    ytdReturn: 31.4,
    returnVsSpy: 12.8,
    winRate: 68.2,
    trades: [
      {
        id: "t1",
        ticker: "NVDA",
        company: "NVIDIA Corporation",
        type: "Purchase",
        amount: "$1M - $5M",
        date: "2026-05-10",
        sector: "Technology",
      },
      {
        id: "t2",
        ticker: "AAPL",
        company: "Apple Inc.",
        type: "Purchase",
        amount: "$500K - $1M",
        date: "2026-04-02",
        sector: "Technology",
      },
      {
        id: "t3",
        ticker: "MSFT",
        company: "Microsoft Corporation",
        type: "Sale",
        amount: "$250K - $500K",
        date: "2026-03-18",
        sector: "Technology",
      },
    ],
  },
  {
    id: "dan-crenshaw",
    name: "Dan Crenshaw",
    party: "Republican",
    chamber: "House",
    state: "TX",
    district: "2",
    committee: "Energy & Commerce",
    totalTrades: 23,
    tradesLast90Days: 9,
    portfolioValue: 4200000,
    ytdReturn: 18.7,
    returnVsSpy: 6.2,
    winRate: 61.5,
    trades: [
      {
        id: "t4",
        ticker: "XOM",
        company: "Exxon Mobil",
        type: "Purchase",
        amount: "$100K - $250K",
        date: "2026-05-01",
        sector: "Energy",
      },
      {
        id: "t5",
        ticker: "CVX",
        company: "Chevron Corporation",
        type: "Purchase",
        amount: "$50K - $100K",
        date: "2026-04-20",
        sector: "Energy",
      },
    ],
  },
  {
    id: "tommy-tuberville",
    name: "Tommy Tuberville",
    party: "Republican",
    chamber: "Senate",
    state: "AL",
    committee: "Armed Services",
    totalTrades: 112,
    tradesLast90Days: 41,
    portfolioValue: 8900000,
    ytdReturn: 24.1,
    returnVsSpy: 9.4,
    winRate: 55.8,
    trades: [
      {
        id: "t6",
        ticker: "LMT",
        company: "Lockheed Martin",
        type: "Purchase",
        amount: "$250K - $500K",
        date: "2026-04-28",
        sector: "Defense",
      },
      {
        id: "t7",
        ticker: "RTX",
        company: "RTX Corporation",
        type: "Purchase",
        amount: "$100K - $250K",
        date: "2026-04-15",
        sector: "Defense",
      },
    ],
  },
  {
    id: "josh-gottheimer",
    name: "Josh Gottheimer",
    party: "Democrat",
    chamber: "House",
    state: "NJ",
    district: "5",
    committee: "Financial Services",
    totalTrades: 34,
    tradesLast90Days: 14,
    portfolioValue: 6100000,
    ytdReturn: 15.3,
    returnVsSpy: 4.1,
    winRate: 58.9,
    trades: [
      {
        id: "t8",
        ticker: "JPM",
        company: "JPMorgan Chase",
        type: "Purchase",
        amount: "$100K - $250K",
        date: "2026-03-05",
        sector: "Financials",
      },
      {
        id: "t8b",
        ticker: "NVDA",
        company: "NVIDIA Corporation",
        type: "Purchase",
        amount: "$250K - $500K",
        date: "2026-04-18",
        sector: "Technology",
      },
    ],
  },
  {
    id: "markwayne-mullin",
    name: "Markwayne Mullin",
    party: "Republican",
    chamber: "Senate",
    state: "OK",
    committee: "Armed Services",
    totalTrades: 89,
    tradesLast90Days: 32,
    portfolioValue: 12500000,
    ytdReturn: 27.8,
    returnVsSpy: 11.3,
    winRate: 63.4,
    trades: [
      {
        id: "t9",
        ticker: "GOOGL",
        company: "Alphabet Inc.",
        type: "Purchase",
        amount: "$500K - $1M",
        date: "2026-03-30",
        sector: "Technology",
      },
      {
        id: "t9b",
        ticker: "LMT",
        company: "Lockheed Martin",
        type: "Purchase",
        amount: "$100K - $250K",
        date: "2026-04-20",
        sector: "Defense",
      },
    ],
  },
  {
    id: "ro-khanna",
    name: "Ro Khanna",
    party: "Democrat",
    chamber: "House",
    state: "CA",
    district: "17",
    committee: "Armed Services",
    totalTrades: 19,
    tradesLast90Days: 7,
    portfolioValue: 3800000,
    ytdReturn: 12.6,
    returnVsSpy: 2.8,
    winRate: 52.1,
    trades: [
      {
        id: "t10",
        ticker: "TSLA",
        company: "Tesla Inc.",
        type: "Sale",
        amount: "$50K - $100K",
        date: "2026-02-22",
        sector: "Consumer Discretionary",
      },
    ],
  },
  {
    id: "shelley-capito",
    name: "Shelley Moore Capito",
    party: "Republican",
    chamber: "Senate",
    state: "WV",
    committee: "Commerce",
    totalTrades: 28,
    tradesLast90Days: 11,
    portfolioValue: 2100000,
    ytdReturn: 9.4,
    returnVsSpy: -1.6,
    winRate: 48.7,
    trades: [
      {
        id: "t11",
        ticker: "UNH",
        company: "UnitedHealth Group",
        type: "Purchase",
        amount: "$50K - $100K",
        date: "2026-05-12",
        sector: "Healthcare",
      },
    ],
  },
  {
    id: "michael-mccaul",
    name: "Michael McCaul",
    party: "Republican",
    chamber: "House",
    state: "TX",
    district: "10",
    committee: "Foreign Affairs",
    totalTrades: 56,
    tradesLast90Days: 22,
    portfolioValue: 19200000,
    ytdReturn: 22.9,
    returnVsSpy: 8.7,
    winRate: 60.3,
    trades: [
      {
        id: "t12",
        ticker: "META",
        company: "Meta Platforms",
        type: "Purchase",
        amount: "$1M - $5M",
        date: "2026-04-08",
        sector: "Technology",
      },
      {
        id: "t12b",
        ticker: "NVDA",
        company: "NVIDIA Corporation",
        type: "Purchase",
        amount: "$500K - $1M",
        date: "2026-05-15",
        sector: "Technology",
      },
    ],
  },
];

export const dashboardStats: DashboardStats = {
  totalPoliticians: politicians.length,
  totalTradesYTD: politicians.reduce((sum, p) => sum + p.totalTrades, 0),
  avgReturn:
    politicians.reduce((sum, p) => sum + p.ytdReturn, 0) / politicians.length,
  topSector: "Technology",
};

export function getPoliticianById(id: string): Politician | undefined {
  return politicians.find((p) => p.id === id);
}

export function searchPoliticians(query: string): Politician[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return politicians;

  return politicians.filter(
    (p) =>
      p.name.toLowerCase().includes(normalized) ||
      p.state.toLowerCase().includes(normalized) ||
      p.party.toLowerCase().includes(normalized) ||
      p.chamber.toLowerCase().includes(normalized) ||
      p.committee.toLowerCase().includes(normalized)
  );
}

export function getLeaderboard(
  sortBy: "return" | "trades" | "portfolio" = "return"
): Politician[] {
  const sorted = [...politicians];

  switch (sortBy) {
    case "trades":
      return sorted.sort((a, b) => b.totalTrades - a.totalTrades);
    case "portfolio":
      return sorted.sort((a, b) => b.portfolioValue - a.portfolioValue);
    case "return":
    default:
      return sorted.sort((a, b) => b.returnVsSpy - a.returnVsSpy);
  }
}

export function getRecentTrades(limit = 10) {
  return politicians
    .flatMap((p) =>
      p.trades.map((t) => ({
        ...t,
        politicianId: p.id,
        politicianName: p.name,
        party: p.party,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
