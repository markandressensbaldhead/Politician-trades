const QUIVER_BASE = "https://api.quiverquant.com/beta";

export interface QuiverInsiderTrade {
  ticker: string;
  name: string;
  tradeDate: string;
  transaction: string;
  amount?: string;
  shares?: number;
  price?: number;
}

export interface QuiverLobbyingRecord {
  ticker: string;
  client: string;
  amount: number;
  year: number;
  issue?: string;
}

export interface QuiverGovContract {
  ticker: string;
  description: string;
  amount: number;
  agency: string;
  date: string;
}

function getQuiverApiKey(): string | null {
  const key = process.env.QUIVERQUANT_API_KEY?.trim();
  return key || null;
}

export function isQuiverAltDataConfigured(): boolean {
  return Boolean(getQuiverApiKey());
}

async function quiverRequest<T>(
  path: string,
  params: Record<string, string | number> = {},
  revalidateSeconds = 900
): Promise<T> {
  const apiKey = getQuiverApiKey();
  if (!apiKey) {
    throw new Error("QUIVERQUANT_API_KEY is not configured");
  }

  const url = new URL(`${QUIVER_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
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
    const body = await response.text().catch(() => "");
    throw new Error(
      `QuiverQuant API error (${response.status}): ${body || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { data?: T[] }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

export async function fetchQuiverInsiderTrades(
  ticker?: string,
  limit = 25
): Promise<QuiverInsiderTrade[]> {
  const path = ticker ? `/live/insiders/${encodeURIComponent(ticker.toUpperCase())}` : "/live/insiders";
  const raw = await quiverRequest<unknown>(path);
  const rows = asArray<Record<string, unknown>>(raw).slice(0, limit);

  return rows
    .map((row) => ({
      ticker: String(row.Ticker ?? row.ticker ?? ticker ?? "").toUpperCase(),
      name: String(row.Name ?? row.name ?? row.Insider ?? "Unknown insider"),
      tradeDate: String(row.Date ?? row.date ?? row.TransactionDate ?? ""),
      transaction: String(row.Transaction ?? row.transaction ?? row.Type ?? ""),
      amount: row.Amount != null ? String(row.Amount) : undefined,
      shares:
        typeof row.Shares === "number"
          ? row.Shares
          : typeof row.shares === "number"
            ? row.shares
            : undefined,
      price:
        typeof row.Price === "number"
          ? row.Price
          : typeof row.price === "number"
            ? row.price
            : undefined,
    }))
    .filter((row) => row.ticker && row.tradeDate);
}

export async function fetchQuiverLobbying(
  ticker?: string,
  limit = 10
): Promise<QuiverLobbyingRecord[]> {
  const path = ticker ? `/live/lobbying/${encodeURIComponent(ticker.toUpperCase())}` : "/live/lobbying";
  const raw = await quiverRequest<unknown>(path);
  const rows = asArray<Record<string, unknown>>(raw).slice(0, limit);

  return rows
    .map((row) => ({
      ticker: String(row.Ticker ?? row.ticker ?? ticker ?? "").toUpperCase(),
      client: String(row.Client ?? row.client ?? row.Company ?? "Unknown client"),
      amount: Number(row.Amount ?? row.amount ?? 0),
      year: Number(row.Year ?? row.year ?? new Date().getFullYear()),
      issue: row.Issue != null ? String(row.Issue) : row.issue != null ? String(row.issue) : undefined,
    }))
    .filter((row) => row.ticker);
}

export async function fetchQuiverGovContracts(
  ticker?: string,
  limit = 10
): Promise<QuiverGovContract[]> {
  const path = ticker
    ? `/live/govcontracts/${encodeURIComponent(ticker.toUpperCase())}`
    : "/live/govcontractsall";
  const raw = await quiverRequest<unknown>(path);
  const rows = asArray<Record<string, unknown>>(raw).slice(0, limit);

  return rows
    .map((row) => ({
      ticker: String(row.Ticker ?? row.ticker ?? ticker ?? "").toUpperCase(),
      description: String(row.Description ?? row.description ?? row.Contract ?? "Government contract"),
      amount: Number(row.Amount ?? row.amount ?? 0),
      agency: String(row.Agency ?? row.agency ?? row.Department ?? "Federal agency"),
      date: String(row.Date ?? row.date ?? row.AwardDate ?? ""),
    }))
    .filter((row) => row.ticker);
}

export async function fetchQuiverTickerAltData(ticker: string) {
  const symbol = ticker.toUpperCase();

  const [insiders, lobbying, contracts] = await Promise.all([
    fetchQuiverInsiderTrades(symbol, 8).catch(() => []),
    fetchQuiverLobbying(symbol, 6).catch(() => []),
    fetchQuiverGovContracts(symbol, 6).catch(() => []),
  ]);

  return { insiders, lobbying, contracts, configured: isQuiverAltDataConfigured() };
}
