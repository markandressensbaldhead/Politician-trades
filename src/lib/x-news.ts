import { TradeCluster } from "@/lib/trade-clusters";
import { TradeOfTheDay } from "@/lib/trade-of-the-day";
import { ScoredTrade } from "@/lib/trade-significance";
import { TrendingTicker } from "@/lib/trade-analytics";

export type XAccountCategory =
  | "trade-alerts"
  | "investigations"
  | "market-news"
  | "retail-finance";

export interface XCuratedAccount {
  id: string;
  handle: string;
  name: string;
  category: XAccountCategory;
  description: string;
  followersLabel?: string;
  whyFollow: string;
}

export type XNewsTopicType =
  | "trade-of-day"
  | "cluster"
  | "trending"
  | "high-conviction"
  | "search";

export interface XTopicalItem {
  id: string;
  type: XNewsTopicType;
  badge: string;
  headline: string;
  summary: string;
  ticker?: string;
  politicianId?: string;
  internalUrl: string;
  xSearchUrl: string;
  relatedHandles: string[];
  timestamp?: string;
}

export const X_ACCOUNT_CATEGORIES: Record<
  XAccountCategory,
  { label: string; description: string }
> = {
  "trade-alerts": {
    label: "Trade alerts",
    description: "First to post new congressional disclosures",
  },
  investigations: {
    label: "Investigations",
    description: "STOCK Act watchdogs and deep dives",
  },
  "market-news": {
    label: "Market breaking",
    description: "Headlines that move before the close",
  },
  "retail-finance": {
    description: "Where retail discovers the narrative",
    label: "Retail finance",
  },
};

export const CURATED_X_ACCOUNTS: XCuratedAccount[] = [
  {
    id: "unusual_whales",
    handle: "unusual_whales",
    name: "Unusual Whales",
    category: "trade-alerts",
    description: "Congressional trade alerts, options flow, political market moves.",
    followersLabel: "2M+",
    whyFollow: "Often breaks new STOCK Act filings within minutes.",
  },
  {
    id: "quiverquant",
    handle: "QuiverQuant",
    name: "Quiver Quantitative",
    category: "trade-alerts",
    description: "Congressional trading data platform and alternative data.",
    whyFollow: "Primary source many finX accounts cite for Capitol flow.",
  },
  {
    id: "deitaone",
    handle: "DeItaone",
    name: "Walter Bloomberg",
    category: "market-news",
    description: "Breaking market and political headlines in real time.",
    followersLabel: "900K+",
    whyFollow: "Fast context when Capitol news hits the tape.",
  },
  {
    id: "propublica",
    handle: "propublica",
    name: "ProPublica",
    category: "investigations",
    description: "Investigative journalism on lawmaker finances.",
    whyFollow: "Original STOCK Act and conflict-of-interest reporting.",
  },
  {
    id: "stockmktnewz",
    handle: "StockMKTNewz",
    name: "Stock Market News",
    category: "market-news",
    description: "Market-moving headlines and political crossover stories.",
    whyFollow: "Surfaces when congressional trades go mainstream.",
  },
  {
    id: "citizenportal",
    handle: "CitizenPortalAI",
    name: "Citizen Portal",
    category: "investigations",
    description: "Congressional activity tracking and policy signals.",
    whyFollow: "Policy + trading overlap from a civic-tech angle.",
  },
  {
    id: "cnbc",
    handle: "CNBC",
    name: "CNBC",
    category: "retail-finance",
    description: "Mainstream business news and retail investor coverage.",
    whyFollow: "When Capitol trades become cable news, it starts here.",
  },
  {
    id: "markettwatch",
    handle: "MarketWatch",
    name: "MarketWatch",
    category: "retail-finance",
    description: "Personal finance and markets for individual investors.",
    whyFollow: "Retail-friendly framing of lawmaker trading stories.",
  },
];

export function buildXProfileUrl(handle: string): string {
  return `https://x.com/${handle.replace(/^@/, "")}`;
}

export function buildXSearchUrl(query: string, live = true): string {
  const params = new URLSearchParams({ q: query });
  if (live) {
    params.set("f", "live");
  }
  return `https://x.com/search?${params.toString()}`;
}

function dedupeItems(items: XTopicalItem[]): XTopicalItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.ticker ?? item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildTopicalXNews(input: {
  tradeOfTheDay: TradeOfTheDay | null;
  clusters: TradeCluster[];
  trending: TrendingTicker[];
  highConviction: ScoredTrade[];
}): XTopicalItem[] {
  const items: XTopicalItem[] = [];

  if (input.tradeOfTheDay) {
    const { trade, actionHeadline, pickDate } = input.tradeOfTheDay;
    items.push({
      id: "trade-of-day",
      type: "trade-of-day",
      badge: "Today's pick",
      headline: actionHeadline,
      summary: `FinX is debating this ${trade.type.toLowerCase()} — verify the filing data here before you deploy.`,
      ticker: trade.ticker,
      politicianId: trade.politicianId,
      internalUrl: `/ticker/${trade.ticker}`,
      xSearchUrl: buildXSearchUrl(
        `"${trade.ticker}" (congress OR congressional OR pelosi OR stock act)`,
        true
      ),
      relatedHandles: ["unusual_whales", "QuiverQuant", "DeItaone"],
      timestamp: pickDate,
    });
  }

  for (const cluster of input.clusters.slice(0, 3)) {
    items.push({
      id: `cluster-${cluster.ticker}`,
      type: "cluster",
      badge: "Crowd signal",
      headline: cluster.headline,
      summary: `${cluster.politicianCount} members · ${cluster.netFlow} on $${cluster.ticker}. Cluster trades often trend on X before mainstream coverage.`,
      ticker: cluster.ticker,
      internalUrl: `/ticker/${cluster.ticker}`,
      xSearchUrl: buildXSearchUrl(
        `$${cluster.ticker} (congress OR "congressional trading" OR "lawmakers")`,
        true
      ),
      relatedHandles: ["unusual_whales", "QuiverQuant", "StockMKTNewz"],
      timestamp: cluster.lastTradeDate,
    });
  }

  for (const entry of input.trending.slice(0, 2)) {
    items.push({
      id: `trending-${entry.ticker}`,
      type: "trending",
      badge: "Hot ticker",
      headline: `$${entry.ticker} — ${entry.politicianCount} lawmakers active`,
      summary: `${entry.tradeCount} disclosures · ${entry.netFlow}. Search X live to see what retail is saying right now.`,
      ticker: entry.ticker,
      internalUrl: `/ticker/${entry.ticker}`,
      xSearchUrl: buildXSearchUrl(`$${entry.ticker} congress stock`, true),
      relatedHandles: ["unusual_whales", "DeItaone"],
      timestamp: entry.lastTradeDate,
    });
  }

  for (const trade of input.highConviction.slice(0, 2)) {
    if (items.some((item) => item.ticker === trade.ticker)) continue;

    items.push({
      id: `conviction-${trade.id}`,
      type: "high-conviction",
      badge: trade.signalTag,
      headline: trade.headline,
      summary: trade.investorTake,
      ticker: trade.ticker,
      politicianId: trade.politicianId,
      internalUrl: `/politician/${trade.politicianId}`,
      xSearchUrl: buildXSearchUrl(
        `${trade.politicianName.split(" ").pop()} ${trade.ticker} stock`,
        true
      ),
      relatedHandles: ["unusual_whales", "propublica"],
      timestamp: trade.filingDate ?? trade.tradeDate,
    });
  }

  items.push({
    id: "search-stock-act",
    type: "search",
    badge: "Live on X",
    headline: "STOCK Act disclosures breaking now",
    summary:
      "Follow the live conversation as new filings drop — then cross-check every claim against primary data here.",
    internalUrl: "/feed",
    xSearchUrl: buildXSearchUrl(
      '("STOCK Act" OR "congressional trading" OR "congress stock")',
      true
    ),
    relatedHandles: ["unusual_whales", "QuiverQuant", "propublica"],
  });

  return dedupeItems(items).slice(0, 8);
}

export function getCuratedAccountsByCategory(): Array<{
  category: XAccountCategory;
  label: string;
  description: string;
  accounts: XCuratedAccount[];
}> {
  return (Object.keys(X_ACCOUNT_CATEGORIES) as XAccountCategory[]).map(
    (category) => ({
      category,
      ...X_ACCOUNT_CATEGORIES[category],
      accounts: CURATED_X_ACCOUNTS.filter(
        (account) => account.category === category
      ),
    })
  );
}

export function getAccountByHandle(handle: string): XCuratedAccount | undefined {
  const normalized = handle.replace(/^@/, "").toLowerCase();
  return CURATED_X_ACCOUNTS.find(
    (account) => account.handle.toLowerCase() === normalized
  );
}
