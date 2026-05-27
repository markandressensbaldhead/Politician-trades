import { Chamber, Party, UnifiedCongressTrade } from "@/types";
import { getDisclosureLagDays } from "@/lib/trade-analytics";
import { slugify } from "@/lib/quiver-mappers";

const FMP_BASE = "https://financialmodelingprep.com/stable";

export interface FmpCongressDisclosure {
  chamber: Chamber;
  symbol: string;
  description?: string;
  type: string;
  amount: string;
  transactionDate: string;
  disclosureDate: string;
  firstName?: string;
  lastName?: string;
  office?: string;
  district?: string;
  owner?: string;
  assetType?: string;
  link?: string;
}

export function getFmpApiKey(): string | null {
  const key = process.env.FMP_API_KEY?.trim();
  return key || null;
}

export function isFmpConfigured(): boolean {
  return Boolean(getFmpApiKey());
}

async function fmpRequest<T>(
  path: string,
  params: Record<string, string | number> = {},
  revalidateSeconds = 600
): Promise<T> {
  const apiKey = getFmpApiKey();
  if (!apiKey) {
    throw new Error("FMP_API_KEY is not configured");
  }

  const url = new URL(`${FMP_BASE}${path}`);
  url.searchParams.set("apikey", apiKey);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`FMP API error (${response.status}): ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function mapFmpParty(_office?: string): Party {
  return "Independent";
}

function mapFmpTradeType(type: string): "Purchase" | "Sale" {
  const normalized = type.toLowerCase();
  if (
    normalized.includes("purchase") ||
    normalized.includes("buy") ||
    normalized === "receive"
  ) {
    return "Purchase";
  }
  return "Sale";
}

function normalizeFmpRecord(
  record: Record<string, string | undefined>,
  chamber: Chamber
): FmpCongressDisclosure | null {
  const symbol = (record.symbol ?? record.ticker ?? "").trim().toUpperCase();
  const transactionDate = record.transactionDate ?? record.transaction_date ?? "";
  const disclosureDate = record.disclosureDate ?? record.disclosure_date ?? "";

  if (!symbol || !transactionDate) {
    return null;
  }

  return {
    chamber,
    symbol,
    description: record.description ?? record.assetDescription,
    type: record.type ?? "Purchase",
    amount: record.amount ?? "Amount undisclosed",
    transactionDate,
    disclosureDate,
    firstName: record.firstName ?? record.representative?.split(" ")[0],
    lastName: record.lastName,
    office: record.office ?? record.representative,
    district: record.district,
    owner: record.owner,
    assetType: record.assetType,
    link: record.link ?? record.filingURL,
  };
}

export function fmpDisclosureToUnified(
  record: FmpCongressDisclosure,
  index: number
): UnifiedCongressTrade {
  const politicianName =
    record.office?.trim() ||
    [record.firstName, record.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown member";
  const politicianId = slugify(politicianName);
  const type = mapFmpTradeType(record.type);

  return {
    id: `fmp-${politicianId}-${record.transactionDate}-${record.symbol}-${index}`,
    politicianId,
    politicianName,
    party: mapFmpParty(record.office),
    chamber: record.chamber,
    ticker: record.symbol,
    company: record.description?.trim() || record.symbol,
    type,
    amount: record.amount,
    tradeDate: record.transactionDate,
    filingDate: record.disclosureDate || null,
    disclosureLagDays: getDisclosureLagDays(
      record.transactionDate,
      record.disclosureDate
    ),
    sector: record.assetType ?? "",
    excessReturn: null,
    dataSource: "fmp",
    filingNotes: record.owner ? `Owner: ${record.owner}` : null,
  };
}

async function fetchLatestDisclosures(
  path: "/house-latest" | "/senate-latest",
  chamber: Chamber,
  options: { maxPages?: number; pageSize?: number; minDate?: string } = {}
): Promise<FmpCongressDisclosure[]> {
  const pageSize = options.pageSize ?? 250;
  const maxPages = options.maxPages ?? 8;
  const minTime = options.minDate ? new Date(options.minDate).getTime() : null;
  const results: FmpCongressDisclosure[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fmpRequest<Record<string, string>[]>(path, {
      page,
      limit: pageSize,
    });

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    let oldestOnPage = Infinity;

    for (const row of batch) {
      const parsed = normalizeFmpRecord(row, chamber);
      if (!parsed) continue;

      const txTime = new Date(parsed.transactionDate).getTime();
      oldestOnPage = Math.min(oldestOnPage, txTime);

      if (minTime != null && txTime < minTime) {
        continue;
      }

      results.push(parsed);
    }

    if (minTime != null && oldestOnPage < minTime) {
      break;
    }

    if (batch.length < pageSize) {
      break;
    }
  }

  return results;
}

export async function fetchFmpCongressDisclosures(options: {
  maxPages?: number;
  lookbackMonths?: number;
} = {}): Promise<FmpCongressDisclosure[]> {
  const lookbackMonths = options.lookbackMonths ?? 18;
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - lookbackMonths);
  const minDateIso = minDate.toISOString().slice(0, 10);

  const [house, senate] = await Promise.all([
    fetchLatestDisclosures("/house-latest", "House", {
      maxPages: options.maxPages ?? 8,
      minDate: minDateIso,
    }),
    fetchLatestDisclosures("/senate-latest", "Senate", {
      maxPages: options.maxPages ?? 8,
      minDate: minDateIso,
    }),
  ]);

  return [...house, ...senate];
}

export async function fetchFmpCongressTrades(options: {
  maxPages?: number;
  lookbackMonths?: number;
} = {}): Promise<UnifiedCongressTrade[]> {
  const disclosures = await fetchFmpCongressDisclosures(options);
  return disclosures.map(fmpDisclosureToUnified);
}

export async function fetchFmpTickerTrades(
  symbol: string,
  chamber: Chamber = "House"
): Promise<FmpCongressDisclosure[]> {
  const path = chamber === "Senate" ? "/senate-trades" : "/house-trades";
  const batch = await fmpRequest<Record<string, string>[]>(path, {
    symbol: symbol.toUpperCase(),
  });

  if (!Array.isArray(batch)) {
    return [];
  }

  return batch
    .map((row) => normalizeFmpRecord(row, chamber))
    .filter((row): row is FmpCongressDisclosure => row != null);
}

export async function fetchFmpInsiderLatest(limit = 50) {
  return fmpRequest<Record<string, string>[]>("/insider-trading/latest", {
    limit,
  });
}
