import { slugify } from "@/lib/quiver-mappers";

const CAPITOL_TRADES_BASES = [
  "https://api.capitoltrades.com",
  "https://app.capitoltrades.com/api",
];

export interface CapitolTradesRecord {
  politicianName: string;
  politicianId: string;
  ticker: string;
  company: string;
  type: "Purchase" | "Sale";
  amount: string;
  tradeDate: string;
  filingDate: string | null;
  disclosureLagDays: number | null;
  sector: string;
  party: string;
  chamber: string;
  committees: string[];
  owner?: string;
  filingUrl?: string;
  price?: number | null;
  value?: number | null;
}

interface CapitolTradesApiTrade {
  txDate?: string;
  pubDate?: string;
  filed_at_date?: string;
  transaction_date?: string;
  filingDate?: string;
  txn_type?: string;
  txType?: string;
  amounts?: string;
  size?: number;
  ticker?: string;
  name?: string;
  party?: string;
  chamber?: string;
  member_type?: string;
  notes?: string;
  filingURL?: string;
  price?: number;
  value?: number;
  politician?: {
    firstName?: string;
    lastName?: string;
    party?: string;
    chamber?: string;
  };
  issuer?: {
    issuerName?: string;
    issuerTicker?: string;
    sector?: string;
  };
  asset?: {
    assetTicker?: string;
  };
  committees?: Array<{ name?: string } | string>;
}

function mapCapitolTradeType(value?: string): "Purchase" | "Sale" {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("buy") || normalized.includes("purchase")) {
    return "Purchase";
  }
  return "Sale";
}

function normalizeCapitolTrade(raw: CapitolTradesApiTrade): CapitolTradesRecord | null {
  const ticker = (
    raw.ticker ??
    raw.asset?.assetTicker ??
    raw.issuer?.issuerTicker ??
    ""
  )
    .replace(/:US$/i, "")
    .trim()
    .toUpperCase();

  const tradeDate = raw.txDate ?? raw.transaction_date ?? "";
  if (!ticker || !tradeDate) {
    return null;
  }

  const politicianName =
    raw.name ??
    [raw.politician?.firstName, raw.politician?.lastName].filter(Boolean).join(" ").trim();

  if (!politicianName) {
    return null;
  }

  const filingDate =
    raw.filingDate ?? raw.filed_at_date ?? raw.pubDate ?? null;
  const tradeTime = new Date(tradeDate).getTime();
  const filingTime = filingDate ? new Date(filingDate).getTime() : null;
  const disclosureLagDays =
    filingTime != null && Number.isFinite(tradeTime)
      ? Math.max(0, Math.round((filingTime - tradeTime) / (1000 * 60 * 60 * 24)))
      : null;

  return {
    politicianName,
    politicianId: slugify(politicianName),
    ticker,
    company: raw.issuer?.issuerName ?? ticker,
    type: mapCapitolTradeType(raw.txType ?? raw.txn_type),
    amount: raw.amounts ?? (raw.size ? `$${raw.size.toLocaleString()}` : "Amount undisclosed"),
    tradeDate,
    filingDate,
    disclosureLagDays,
    sector: raw.issuer?.sector ?? "",
    party: raw.party ?? raw.politician?.party ?? "",
    chamber: raw.chamber ?? raw.member_type ?? raw.politician?.chamber ?? "",
    committees: (raw.committees ?? [])
      .map((entry) => (typeof entry === "string" ? entry : entry.name ?? ""))
      .filter(Boolean),
    owner: raw.notes,
    filingUrl: raw.filingURL,
    price: raw.price ?? null,
    value: raw.value ?? null,
  };
}

async function capitolTradesRequest<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T | null> {
  for (const base of CAPITOL_TRADES_BASES) {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "TradeTheHill/1.0 (research@tradethehill.org)",
        },
        next: { revalidate: 600 },
      });

      if (!response.ok) {
        continue;
      }

      return (await response.json()) as T;
    } catch {
      continue;
    }
  }

  return null;
}

export function isCapitolTradesConfigured(): boolean {
  return process.env.CAPITOL_TRADES_ENABLED !== "false";
}

export async function fetchCapitolTradesRecent(options: {
  pageSize?: number;
  maxPages?: number;
  ticker?: string;
} = {}): Promise<CapitolTradesRecord[]> {
  if (!isCapitolTradesConfigured()) {
    return [];
  }

  const pageSize = options.pageSize ?? 100;
  const maxPages = options.maxPages ?? 6;
  const merged = new Map<string, CapitolTradesRecord>();

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const payload = await capitolTradesRequest<{ data?: CapitolTradesApiTrade[] } | CapitolTradesApiTrade[]>(
      "/trades",
      {
        pageSize,
        pageNumber,
        ...(options.ticker ? { ticker: options.ticker.toUpperCase() } : {}),
      }
    );

    const batch = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    if (batch.length === 0) {
      break;
    }

    for (const raw of batch) {
      const normalized = normalizeCapitolTrade(raw);
      if (!normalized) continue;
      merged.set(
        `${normalized.politicianId}|${normalized.ticker}|${normalized.tradeDate}|${normalized.type}`,
        normalized
      );
    }

    if (batch.length < pageSize) {
      break;
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
  );
}

export async function fetchCapitolTradesByTicker(
  ticker: string,
  limit = 100
): Promise<CapitolTradesRecord[]> {
  return fetchCapitolTradesRecent({
    ticker,
    pageSize: Math.min(limit, 100),
    maxPages: Math.ceil(limit / 100),
  });
}
