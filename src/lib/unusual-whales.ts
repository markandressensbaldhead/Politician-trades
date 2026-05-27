import { Chamber, Party } from "@/types";
import { slugify } from "@/lib/quiver-mappers";

const UW_API_BASE = "https://api.unusualwhales.com/api";

export interface UnusualWhalesTrade {
  amounts: string;
  filed_at_date: string;
  is_active?: boolean;
  issuer?: string;
  member_type?: string;
  name: string;
  notes?: string;
  politician_id: string;
  reporter?: string;
  ticker: string;
  transaction_date: string;
  txn_type: string;
  party?: string;
  chamber?: string;
}

export interface UnusualWhalesPolitician {
  politician_id: string;
  name: string;
  party?: string;
  member_type?: string;
  chamber?: string;
  trade_count?: number;
  first_trade_date?: string;
  last_trade_date?: string;
}

export interface UnusualWhalesPortfolioHolder {
  full_name: string;
  id: string;
  max_amount?: number;
  mid_amount?: number;
  min_amount?: number;
  owner?: string;
}

export interface UnusualWhalesCongressStats {
  date?: string;
  type?: string;
  data: Record<string, unknown> | null;
}

interface UnusualWhalesListResponse<T> {
  data: T[];
}

export function getUnusualWhalesApiKey(): string | null {
  const key = process.env.UNUSUAL_WHALES_API_KEY?.trim();
  return key || null;
}

export function isUnusualWhalesConfigured(): boolean {
  return Boolean(getUnusualWhalesApiKey());
}

async function unusualWhalesRequest<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidateSeconds = 300
): Promise<T> {
  const apiKey = getUnusualWhalesApiKey();

  if (!apiKey) {
    throw new Error("UNUSUAL_WHALES_API_KEY is not configured");
  }

  const url = new URL(`${UW_API_BASE}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Unusual Whales API error (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

export function mapUnusualWhalesParty(party?: string): Party {
  if (!party) return "Independent";
  const normalized = party.toLowerCase();
  if (normalized.startsWith("d")) return "Democrat";
  if (normalized.startsWith("r")) return "Republican";
  return "Independent";
}

export function mapUnusualWhalesChamber(
  memberType?: string,
  chamber?: string
): Chamber {
  const value = (chamber ?? memberType ?? "").toLowerCase();
  if (value.includes("senate")) return "Senate";
  if (value.includes("executive")) return "Executive";
  return "House";
}

export function mapUnusualWhalesTradeType(txnType: string): "Purchase" | "Sale" {
  const normalized = txnType.toLowerCase();
  if (normalized.includes("buy") || normalized.includes("purchase")) {
    return "Purchase";
  }
  return "Sale";
}

export function resolvePoliticianId(trade: UnusualWhalesTrade): string {
  return slugify(trade.name);
}

export async function fetchCongressRecentTrades(options: {
  limit?: number;
  ticker?: string;
  date?: string;
} = {}): Promise<UnusualWhalesTrade[]> {
  const response = await unusualWhalesRequest<
    UnusualWhalesListResponse<UnusualWhalesTrade>
  >("/congress/recent-trades", {
    limit: options.limit ?? 200,
    ticker: options.ticker,
    date: options.date,
  });

  return response.data ?? [];
}

export async function fetchPoliticianRecentTrades(options: {
  limit?: number;
  page?: number;
  ticker?: string;
  politicianId?: string;
  transactionNewerThan?: string;
} = {}): Promise<UnusualWhalesTrade[]> {
  const response = await unusualWhalesRequest<
    UnusualWhalesListResponse<UnusualWhalesTrade>
  >("/politician-portfolios/recent_trades", {
    limit: options.limit ?? 500,
    page: options.page ?? 0,
    ticker: options.ticker,
    politician_id: options.politicianId,
    transaction_newer_than: options.transactionNewerThan,
  });

  return response.data ?? [];
}

export async function fetchAllPoliticianTrades(options: {
  maxPages?: number;
  transactionNewerThan?: string;
} = {}): Promise<UnusualWhalesTrade[]> {
  const maxPages = options.maxPages ?? 24;
  const pageSize = 500;
  const merged = new Map<string, UnusualWhalesTrade>();

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fetchPoliticianRecentTrades({
      limit: pageSize,
      page,
      transactionNewerThan: options.transactionNewerThan,
    });

    if (batch.length === 0) {
      break;
    }

    for (const trade of batch) {
      const key = [
        trade.politician_id,
        trade.ticker,
        trade.transaction_date,
        trade.txn_type,
        trade.amounts,
        trade.filed_at_date,
      ].join("|");

      merged.set(key, trade);
    }

    if (batch.length < pageSize) {
      break;
    }
  }

  return [...merged.values()];
}

export async function fetchCongressPoliticians(options: {
  lastTradedWithinMonths?: number;
} = {}): Promise<UnusualWhalesPolitician[]> {
  const response = await unusualWhalesRequest<
    UnusualWhalesListResponse<UnusualWhalesPolitician>
  >("/congress/politicians", {
    last_traded_within_months: options.lastTradedWithinMonths ?? 24,
  });

  return response.data ?? [];
}

export async function fetchPoliticianPortfolioPeople(): Promise<
  Array<{ id: string; name: string }>
> {
  const response = await unusualWhalesRequest<
    UnusualWhalesListResponse<{ id: string; name: string }>
  >("/politician-portfolios/people");

  return response.data ?? [];
}

export async function fetchPoliticianHoldersByTicker(
  ticker: string,
  aggregateAllPortfolios = true
): Promise<UnusualWhalesPortfolioHolder[]> {
  const symbol = ticker.toUpperCase();
  const response = await unusualWhalesRequest<
    UnusualWhalesListResponse<UnusualWhalesPortfolioHolder>
  >(
    `/politician-portfolios/holders/${encodeURIComponent(symbol)}`,
    {
      aggregate_all_portfolios: aggregateAllPortfolios,
    },
    600
  );

  return response.data ?? [];
}

export async function fetchCongressUnusualTradeStats(): Promise<UnusualWhalesCongressStats> {
  return unusualWhalesRequest<UnusualWhalesCongressStats>(
    "/congress/unusual-trades/stats",
    {},
    600
  );
}

export async function buildPoliticianMetaIndex(): Promise<
  Map<
    string,
    {
      name: string;
      party: Party;
      chamber: Chamber;
      uwPoliticianId: string;
    }
  >
> {
  const index = new Map<
    string,
    {
      name: string;
      party: Party;
      chamber: Chamber;
      uwPoliticianId: string;
    }
  >();

  try {
    const politicians = await fetchCongressPoliticians({
      lastTradedWithinMonths: 36,
    });

    for (const politician of politicians) {
      const slug = slugify(politician.name);
      index.set(slug, {
        name: politician.name,
        party: mapUnusualWhalesParty(politician.party),
        chamber: mapUnusualWhalesChamber(
          politician.member_type,
          politician.chamber
        ),
        uwPoliticianId: politician.politician_id,
      });
      index.set(politician.politician_id, {
        name: politician.name,
        party: mapUnusualWhalesParty(politician.party),
        chamber: mapUnusualWhalesChamber(
          politician.member_type,
          politician.chamber
        ),
        uwPoliticianId: politician.politician_id,
      });
    }
  } catch (error) {
    console.error(
      "Unusual Whales politician index failed:",
      error instanceof Error ? error.message : error
    );
  }

  return index;
}
