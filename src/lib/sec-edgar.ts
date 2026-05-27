import { EdgarFiling } from "@/types";

const SEC_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index";
const SEC_COMPANY_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK";

const DEFAULT_USER_AGENT =
  "CapitolTrades/1.0 (contact@capitoltrades.app; financial research dashboard)";

interface EdgarSearchHit {
  _id?: string;
  _source?: {
    adsh?: string;
    ciks?: string[];
    display_names?: string[];
    file_date?: string;
    form?: string;
    file_type?: string;
    period_ending?: string;
    entity_name?: string;
    tickers?: string[];
    root_forms?: string[];
  };
}

interface EdgarSearchResponse {
  hits?: {
    hits?: EdgarSearchHit[];
    total?: { value?: number };
  };
}

interface CompanyTickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

interface RecentFilings {
  accessionNumber?: string[];
  filingDate?: string[];
  form?: string[];
  primaryDocument?: string[];
  reportDate?: string[];
}

let companyTickerCache:
  | {
      expiresAt: number;
      byTicker: Map<string, { cik: string; title: string }>;
    }
  | undefined;

function getSecUserAgent(): string {
  return process.env.SEC_EDGAR_USER_AGENT ?? DEFAULT_USER_AGENT;
}

function secHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": getSecUserAgent(),
  };
}

function padCik(cik: string | number): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

function buildDocumentUrl(cik: string, adsh: string, primaryDocument?: string): string {
  const cikNumber = String(Number(cik));
  const adshClean = adsh.replace(/-/g, "");

  if (primaryDocument) {
    return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${adshClean}/${primaryDocument}`;
  }

  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikNumber}&type=&dateb=&owner=include&count=40`;
}

async function getCompanyTickerMap(): Promise<
  Map<string, { cik: string; title: string }>
> {
  if (companyTickerCache && companyTickerCache.expiresAt > Date.now()) {
    return companyTickerCache.byTicker;
  }

  const response = await fetch(SEC_COMPANY_TICKERS_URL, {
    headers: secHeaders(),
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`SEC company tickers error (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, CompanyTickerEntry>;
  const byTicker = new Map<string, { cik: string; title: string }>();

  for (const entry of Object.values(payload)) {
    byTicker.set(entry.ticker.toUpperCase(), {
      cik: padCik(entry.cik_str),
      title: entry.title,
    });
  }

  companyTickerCache = {
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    byTicker,
  };

  return byTicker;
}

function mapSearchHit(hit: EdgarSearchHit, source: EdgarFiling["source"]): EdgarFiling | null {
  const meta = hit._source;
  if (!meta?.adsh || !meta.form || !meta.file_date) {
    return null;
  }

  const cik = meta.ciks?.[0] ?? "unknown";
  const entityName =
    meta.display_names?.[0] ?? meta.entity_name ?? "Unknown filer";
  const ticker = meta.tickers?.[0];

  return {
    id: hit._id ?? meta.adsh,
    form: meta.form,
    filedAt: meta.file_date,
    title: `${meta.form} · ${entityName}`,
    entityName,
    ticker,
    source,
    documentUrl: buildDocumentUrl(cik, meta.adsh),
  };
}

export async function searchPoliticianFilings(
  politicianName: string,
  limit = 8
): Promise<EdgarFiling[]> {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);

  const params = new URLSearchParams({
    q: `"${politicianName}"`,
    dateRange: "custom",
    startdt: startDate.toISOString().slice(0, 10),
    enddt: new Date().toISOString().slice(0, 10),
    forms: "3,4,5,D,13F-HR",
  });

  const response = await fetch(`${SEC_SEARCH_URL}?${params.toString()}`, {
    headers: secHeaders(),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`SEC EDGAR search error (${response.status})`);
  }

  const payload = (await response.json()) as EdgarSearchResponse;

  return (payload.hits?.hits ?? [])
    .map((hit) => mapSearchHit(hit, "politician-search"))
    .filter((filing): filing is EdgarFiling => Boolean(filing))
    .slice(0, limit);
}

export async function getCompanyFilingsForTicker(
  ticker: string,
  limit = 5
): Promise<EdgarFiling[]> {
  const tickerMap = await getCompanyTickerMap();
  const company = tickerMap.get(ticker.toUpperCase());

  if (!company) {
    return [];
  }

  const response = await fetch(`${SEC_SUBMISSIONS_URL}${company.cik}.json`, {
    headers: secHeaders(),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    name?: string;
    filings?: { recent?: RecentFilings };
  };

  const recent = payload.filings?.recent;
  if (!recent?.form?.length) {
    return [];
  }

  const filings: EdgarFiling[] = [];

  for (let index = 0; index < recent.form.length; index += 1) {
    const form = recent.form[index];
    if (!form || !["10-K", "10-Q", "8-K", "4"].includes(form)) {
      continue;
    }

    const adsh = recent.accessionNumber?.[index];
    const filedAt = recent.filingDate?.[index];
    const primaryDocument = recent.primaryDocument?.[index];

    if (!adsh || !filedAt) {
      continue;
    }

    filings.push({
      id: `${ticker}-${adsh}`,
      form,
      filedAt,
      title: `${form} · ${payload.name ?? company.title}`,
      entityName: payload.name ?? company.title,
      ticker: ticker.toUpperCase(),
      source: "company-filing",
      documentUrl: buildDocumentUrl(company.cik, adsh, primaryDocument),
    });

    if (filings.length >= limit) {
      break;
    }
  }

  return filings;
}

export async function fetchFilingExcerpt(documentUrl: string, maxChars = 6000): Promise<string> {
  const response = await fetch(documentUrl, {
    headers: {
      ...secHeaders(),
      Accept: "text/html,application/xml,text/plain,*/*",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return "";
  }

  const raw = await response.text();
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, maxChars);
}

export async function getFilingsForPolitician(input: {
  politicianName: string;
  tickers: string[];
  politicianLimit?: number;
  tickerLimit?: number;
}): Promise<EdgarFiling[]> {
  const politicianLimit = input.politicianLimit ?? 6;
  const tickerLimit = input.tickerLimit ?? 3;
  const uniqueTickers = [...new Set(input.tickers.map((t) => t.toUpperCase()))].slice(0, 5);

  const [politicianFilings, ...companyResults] = await Promise.all([
    searchPoliticianFilings(input.politicianName, politicianLimit).catch(() => []),
    ...uniqueTickers.map((ticker) =>
      getCompanyFilingsForTicker(ticker, tickerLimit).catch(() => [])
    ),
  ]);

  const combined = [...politicianFilings, ...companyResults.flat()];
  const seen = new Set<string>();

  return combined.filter((filing) => {
    if (seen.has(filing.id)) {
      return false;
    }

    seen.add(filing.id);
    return true;
  });
}

export async function enrichFilingsWithExcerpts(
  filings: EdgarFiling[],
  maxFilings = 4
): Promise<EdgarFiling[]> {
  const selected = filings.slice(0, maxFilings);

  return Promise.all(
    selected.map(async (filing) => ({
      ...filing,
      excerpt: filing.excerpt ?? (await fetchFilingExcerpt(filing.documentUrl)),
    }))
  );
}
