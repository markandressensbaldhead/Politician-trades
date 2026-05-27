import { EdgarFiling, PoliticianProfileData, TradeSecSnapshot } from "@/types";
import { CongressTradeRow } from "@/types/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface SecFilingRow {
  filing_key: string;
  politician_id: string;
  politician_name: string | null;
  form: string;
  filed_at: string;
  title: string;
  entity_name: string;
  ticker: string | null;
  source: string;
  document_url: string;
  excerpt: string | null;
  category: string;
  category_label: string;
  days_ago: number;
  recency_label: string;
  priority: number;
  is_featured: boolean;
  trade_keys: string[];
  filing_data: Record<string, unknown>;
  synced_at: string;
  updated_at: string;
}

export function edgarFilingToRow(
  politicianId: string,
  politicianName: string | null,
  filing: EdgarFiling,
  tradeKeys: string[] = []
): SecFilingRow {
  const now = new Date().toISOString();

  return {
    filing_key: filing.id,
    politician_id: politicianId,
    politician_name: politicianName,
    form: filing.form,
    filed_at: filing.filedAt,
    title: filing.title,
    entity_name: filing.entityName,
    ticker: filing.ticker ?? null,
    source: filing.source,
    document_url: filing.documentUrl,
    excerpt: filing.excerpt ?? null,
    category: filing.category,
    category_label: filing.categoryLabel,
    days_ago: filing.daysAgo,
    recency_label: filing.recencyLabel,
    priority: filing.priority,
    is_featured: filing.isFeatured ?? false,
    trade_keys: tradeKeys,
    filing_data: filing as unknown as Record<string, unknown>,
    synced_at: now,
    updated_at: now,
  };
}

export function rowToEdgarFiling(row: SecFilingRow): EdgarFiling {
  const fromJson = row.filing_data as Partial<EdgarFiling> | undefined;

  return {
    id: row.filing_key,
    form: row.form,
    filedAt: row.filed_at,
    title: row.title,
    entityName: row.entity_name,
    ticker: row.ticker ?? undefined,
    source: row.source as EdgarFiling["source"],
    documentUrl: row.document_url,
    excerpt: row.excerpt ?? undefined,
    category: row.category as EdgarFiling["category"],
    categoryLabel: row.category_label,
    daysAgo: row.days_ago,
    recencyLabel: row.recency_label,
    priority: Number(row.priority),
    isFeatured: row.is_featured,
    ...fromJson,
  };
}

export async function upsertSecFilings(rows: SecFilingRow[]): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = getSupabaseServerClient();
  let upserted = 0;

  for (const row of rows) {
    const { error } = await supabase.from("sec_filings").upsert(row, {
      onConflict: "filing_key",
    });

    if (error) {
      if (error.message.includes("sec_filings")) {
        continue;
      }

      throw new Error(`Failed to upsert SEC filing: ${error.message}`);
    }

    upserted += 1;
  }

  return upserted;
}

export async function getStoredFilingsForPolitician(
  politicianId: string,
  limit = 100
): Promise<EdgarFiling[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("sec_filings")
    .select("*")
    .eq("politician_id", politicianId)
    .order("filed_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("sec_filings")) {
      return [];
    }

    throw new Error(`Failed to fetch SEC filings: ${error.message}`);
  }

  return ((data ?? []) as SecFilingRow[]).map(rowToEdgarFiling);
}

export async function getStoredFilingsSyncMeta(politicianId: string): Promise<{
  count: number;
  lastSyncedAt: string | null;
}> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("sec_filings")
    .select("synced_at")
    .eq("politician_id", politicianId)
    .order("synced_at", { ascending: false })
    .limit(1);

  if (error) {
    if (error.message.includes("sec_filings")) {
      return { count: 0, lastSyncedAt: null };
    }

    throw new Error(`Failed to fetch SEC sync meta: ${error.message}`);
  }

  const { count, error: countError } = await supabase
    .from("sec_filings")
    .select("*", { count: "exact", head: true })
    .eq("politician_id", politicianId);

  if (countError && !countError.message.includes("sec_filings")) {
    throw new Error(`Failed to count SEC filings: ${countError.message}`);
  }

  return {
    count: count ?? 0,
    lastSyncedAt: (data?.[0] as { synced_at?: string } | undefined)?.synced_at ?? null,
  };
}

export async function updateTradeSecData(
  tradeKey: string,
  secData: TradeSecSnapshot
): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("congress_trades")
    .update({
      sec_data: secData,
      sec_synced_at: secData.syncedAt,
    })
    .eq("trade_key", tradeKey);

  if (error) {
    if (error.message.includes("sec_data")) {
      return;
    }

    throw new Error(`Failed to update trade SEC data: ${error.message}`);
  }
}

export async function getTradeSecDataByPolitician(
  politicianId: string
): Promise<Map<string, TradeSecSnapshot>> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("congress_trades")
    .select("trade_key, sec_data")
    .eq("politician_id", politicianId)
    .not("sec_data", "is", null);

  if (error) {
    if (error.message.includes("sec_data")) {
      return new Map();
    }

    throw new Error(`Failed to fetch trade SEC data: ${error.message}`);
  }

  const map = new Map<string, TradeSecSnapshot>();

  for (const row of data ?? []) {
    const snapshot = row.sec_data as TradeSecSnapshot | null;
    if (snapshot?.filings?.length) {
      map.set(row.trade_key as string, snapshot);
    }
  }

  return map;
}

export function mergeSecIntoProfileTrades(
  trades: PoliticianProfileData["trades"],
  politicianId: string,
  secByTradeKey: Map<string, TradeSecSnapshot>
): PoliticianProfileData["trades"] {
  return trades.map((trade) => {
    const tradeKey = buildTradeKeyFromProfile(politicianId, trade);
    const snapshot = secByTradeKey.get(tradeKey);

    if (!snapshot) {
      return trade;
    }

    return {
      ...trade,
      secFilings: snapshot.filings,
      secSyncedAt: snapshot.syncedAt,
    };
  });
}

export async function getSecFilingsGroupedByTradeKey(
  politicianId: string
): Promise<Map<string, EdgarFiling[]>> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("sec_filings")
    .select("*")
    .eq("politician_id", politicianId);

  if (error) {
    if (error.message.includes("sec_filings")) {
      return new Map();
    }

    throw new Error(`Failed to group SEC filings by trade: ${error.message}`);
  }

  const map = new Map<string, EdgarFiling[]>();

  for (const row of (data ?? []) as SecFilingRow[]) {
    const filing = rowToEdgarFiling(row);

    for (const tradeKey of row.trade_keys ?? []) {
      const existing = map.get(tradeKey) ?? [];
      existing.push(filing);
      map.set(tradeKey, existing);
    }
  }

  return map;
}

export async function enrichProfileWithLockedSecData(
  profile: PoliticianProfileData
): Promise<PoliticianProfileData> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");

  if (!isSupabaseConfigured()) {
    return profile;
  }

  const [secByTradeKey, filingsByTradeKey] = await Promise.all([
    getTradeSecDataByPolitician(profile.id),
    getSecFilingsGroupedByTradeKey(profile.id),
  ]);

  if (secByTradeKey.size === 0 && filingsByTradeKey.size === 0) {
    return profile;
  }

  const trades = profile.trades.map((trade) => {
    const tradeKey = buildTradeKeyFromProfile(profile.id, trade);
    const snapshot = secByTradeKey.get(tradeKey);
    const linkedFilings = filingsByTradeKey.get(tradeKey) ?? [];
    const filings = snapshot?.filings?.length
      ? snapshot.filings
      : linkedFilings;

    if (filings.length === 0) {
      return trade;
    }

    return {
      ...trade,
      secFilings: filings,
      secSyncedAt: snapshot?.syncedAt ?? undefined,
    };
  });

  return { ...profile, trades };
}

function buildTradeKeyFromProfile(
  politicianId: string,
  trade: { ticker: string; tradeDate: string; type: string; amount: string }
): string {
  return [
    politicianId,
    trade.ticker,
    trade.tradeDate,
    trade.type,
    trade.amount,
  ].join("|");
}

export async function getDistinctPoliticiansFromTrades(): Promise<
  Array<{ politicianId: string; politicianName: string; tickers: string[] }>
> {
  const supabase = getSupabaseServerClient();
  const grouped = new Map<
    string,
    { politicianName: string; tickers: Set<string> }
  >();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("congress_trades")
      .select("politician_id, politician_name, ticker")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to list politicians for SEC sync: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      const politicianId = row.politician_id as string;
      const existing = grouped.get(politicianId) ?? {
        politicianName: (row.politician_name as string | null) ?? politicianId,
        tickers: new Set<string>(),
      };

      existing.tickers.add((row.ticker as string).toUpperCase());
      grouped.set(politicianId, existing);
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return [...grouped.entries()].map(([politicianId, value]) => ({
    politicianId,
    politicianName: value.politicianName,
    tickers: [...value.tickers],
  }));
}

export function congressRowToTradeInsert(row: CongressTradeRow) {
  return {
    trade_key: row.trade_key,
    politician_id: row.politician_id,
    politician_name: row.politician_name,
    ticker: row.ticker,
    trade_type: row.trade_type,
    amount_range: row.amount_range,
    trade_date: row.trade_date,
    filing_date: row.filing_date,
    sector: row.sector,
    excess_return: row.excess_return,
  };
}
