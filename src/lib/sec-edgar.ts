import { EdgarFiling } from "@/types";
import { enrichFilingMetadata, rankFilings } from "@/lib/filing-utils";

const SEC_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index";
const SEC_COMPANY_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK";

const DEFAULT_USER_AGENT =
  "CapitolTrades/1.0 (contact@capitoltrades.app; financial research dashboard)";

const TRACKED_FORMS = new Set([
  "8-K",
  "8-K/A",
  "4",
  "4/A",
  "3",
  "3/A",
  "5",
  "5/A",
  "10-K",
  "10-K/A",
  "10-Q",
  "10-Q/A",
  "DEF 14A",
  "DEFA14A",
  "S-1",
  "S-1/A",
  "13F-HR",
  "13D",
  "13G",
  "424B5",
]);

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
  items?: string[];
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

function buildDocumentUrl(
  cik: string,
  adsh: string,
  primaryDocument?: string
): string {
  const cikNumber = String(Number(cik));
  const adshClean = adsh.replace(/-/g, "");

  if (primaryDocument) {
    return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${adshClean}/${primaryDocument}`;
  }

  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikNumber}&type=&dateb=&owner=include&count=40`;
}

function isTrackedForm(form: string): boolean {
  const upper = form.toUpperCase();
  if (TRACKED_FORMS.has(upper)) {
    return true;
  }

  return (
    upper.startsWith("8-K") ||
    upper.startsWith("10-K") ||
    upper.startsWith("10-Q") ||
    upper.startsWith("4") ||
    upper.startsWith("3") ||
    upper.startsWith("5")
  );
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

function mapSearchHit(
  hit: EdgarSearchHit,
  source: EdgarFiling["source"]
): EdgarFiling | null {
  const meta = hit._source;
  if (!meta?.adsh || !meta.form || !meta.file_date) {
    return null;
  }

  const cik = meta.ciks?.[0] ?? "unknown";
  const entityName =
    meta.display_names?.[0] ?? meta.entity_name ?? "Unknown filer";
  const ticker = meta.tickers?.[0];
  const itemNote = meta.root_forms?.[0] ? ` (${meta.root_forms[0]})` : "";

  return enrichFilingMetadata({
    id: hit._id ?? meta.adsh,
    form: meta.form,
    filedAt: meta.file_date,
    title: `${meta.form}${itemNote} · ${entityName}`,
    entityName,
    ticker,
    source,
    documentUrl: buildDocumentUrl(cik, meta.adsh),
  });
}

export async function searchPoliticianFilings(
  politicianName: string,
  limit = 12
): Promise<EdgarFiling[]> {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);

  const params = new URLSearchParams({
    q: `"${politicianName}"`,
    dateRange: "custom",
    startdt: startDate.toISOString().slice(0, 10),
    enddt: new Date().toISOString().slice(0, 10),
    forms: "3,4,5,8-K,10-K,10-Q,D,DEF 14A",
  });

  const response = await fetch(`${SEC_SEARCH_URL}?${params.toString()}`, {
    headers: secHeaders(),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`SEC EDGAR search error (${response.status})`);
  }

  const payload = (await response.json()) as EdgarSearchResponse;

  return rankFilings(
    (payload.hits?.hits ?? [])
      .map((hit) => mapSearchHit(hit, "politician-search"))
      .filter((filing): filing is EdgarFiling => Boolean(filing))
  ).slice(0, limit);
}

export async function searchCompanyFilingsByName(
  companyName: string,
  limit = 12
): Promise<EdgarFiling[]> {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const params = new URLSearchParams({
    q: `"${companyName}"`,
    dateRange: "custom",
    startdt: startDate.toISOString().slice(0, 10),
    enddt: new Date().toISOString().slice(0, 10),
    forms: "8-K,4,10-K,10-Q,DEF 14A,S-1",
  });

  const response = await fetch(`${SEC_SEARCH_URL}?${params.toString()}`, {
    headers: secHeaders(),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as EdgarSearchResponse;

  return rankFilings(
    (payload.hits?.hits ?? [])
      .map((hit) => mapSearchHit(hit, "company-filing"))
      .filter((filing): filing is EdgarFiling => Boolean(filing))
  ).slice(0, limit);
}

export async function getCompanyFilingsForTicker(
  ticker: string,
  limit = 12
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

  const candidates: EdgarFiling[] = [];

  for (let index = 0; index < recent.form.length; index += 1) {
    const form = recent.form[index];
    if (!form || !isTrackedForm(form)) {
      continue;
    }

    const adsh = recent.accessionNumber?.[index];
    const filedAt = recent.filingDate?.[index];
    const primaryDocument = recent.primaryDocument?.[index];
    const item = recent.items?.[index];

    if (!adsh || !filedAt) {
      continue;
    }

    const itemSuffix = item ? ` · Item ${item}` : "";

    candidates.push(
      enrichFilingMetadata({
        id: `${ticker}-${adsh}`,
        form,
        filedAt,
        title: `${form}${itemSuffix} · ${payload.name ?? company.title}`,
        entityName: payload.name ?? company.title,
        ticker: ticker.toUpperCase(),
        source: "company-filing",
        documentUrl: buildDocumentUrl(company.cik, adsh, primaryDocument),
      })
    );
  }

  return rankFilings(candidates).slice(0, limit);
}

export async function fetchFilingExcerpt(
  documentUrl: string,
  maxChars = 6000
): Promise<string> {
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

function dedupeFilings(filings: EdgarFiling[]): EdgarFiling[] {
  const seen = new Set<string>();

  return filings.filter((filing) => {
    if (seen.has(filing.id)) {
      return false;
    }

    seen.add(filing.id);
    return true;
  });
}

export async function getFilingsForPolitician(input: {
  politicianName: string;
  tickers: string[];
  politicianLimit?: number;
  tickerLimit?: number;
}): Promise<EdgarFiling[]> {
  const politicianLimit = input.politicianLimit ?? 8;
  const tickerLimit = input.tickerLimit ?? 8;
  const uniqueTickers = [...new Set(input.tickers.map((t) => t.toUpperCase()))].slice(
    0,
    6
  );

  const [politicianFilings, ...companyResults] = await Promise.all([
    searchPoliticianFilings(input.politicianName, politicianLimit).catch(() => []),
    ...uniqueTickers.map((ticker) =>
      getCompanyFilingsForTicker(ticker, tickerLimit).catch(() => [])
    ),
  ]);

  return rankFilings(dedupeFilings([...politicianFilings, ...companyResults.flat()]));
}

export async function enrichFilingsWithExcerpts(
  filings: EdgarFiling[],
  maxFilings = 4
): Promise<EdgarFiling[]> {
  const selected = rankFilings(filings).slice(0, maxFilings);

  return Promise.all(
    selected.map(async (filing) => ({
      ...filing,
      excerpt: filing.excerpt ?? (await fetchFilingExcerpt(filing.documentUrl)),
    }))
  );
}
