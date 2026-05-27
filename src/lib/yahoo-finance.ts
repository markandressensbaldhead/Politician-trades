import { MarketQuote } from "@/types";
import { BRAND } from "@/lib/brand";

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/\./g, "-");
}

function yahooHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": `Mozilla/5.0 (compatible; ${BRAND.userAgent}; +${BRAND.url})`,
  };
}

async function fetchChartQuote(ticker: string): Promise<MarketQuote> {
  const normalized = normalizeTicker(ticker);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}?interval=1d&range=1d`;

  const response = await fetch(url, {
    headers: yahooHeaders(),
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance error (${response.status})`);
  }

  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          symbol?: string;
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          shortName?: string;
          longName?: string;
          currency?: string;
        };
      }>;
    };
  };

  const meta = payload.chart?.result?.[0]?.meta;
  const price =
    typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
  const previousClose =
    typeof meta?.chartPreviousClose === "number" ? meta.chartPreviousClose : null;
  const changePercent =
    price != null && previousClose != null && previousClose !== 0
      ? ((price - previousClose) / previousClose) * 100
      : null;

  return {
    ticker: meta?.symbol ?? normalized,
    price,
    changePercent,
    marketCap: null,
    currency: meta?.currency ?? "USD",
    shortName: meta?.shortName ?? meta?.longName ?? null,
  };
}

export async function getMarketQuotes(
  tickers: string[]
): Promise<Record<string, MarketQuote>> {
  const uniqueTickers = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];
  const quotes: Record<string, MarketQuote> = {};

  if (uniqueTickers.length === 0) {
    return quotes;
  }

  const results = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        return await fetchChartQuote(ticker);
      } catch {
        return {
          ticker,
          price: null,
          changePercent: null,
          marketCap: null,
          currency: "USD",
          shortName: null,
        } satisfies MarketQuote;
      }
    })
  );

  for (const quote of results) {
    const key = normalizeTicker(quote.ticker);
    quotes[key] = quote;
  }

  return quotes;
}

export async function getMarketQuote(ticker: string): Promise<MarketQuote> {
  const quotes = await getMarketQuotes([ticker]);
  return (
    quotes[normalizeTicker(ticker)] ?? {
      ticker: normalizeTicker(ticker),
      price: null,
      changePercent: null,
      marketCap: null,
      currency: "USD",
      shortName: null,
    }
  );
}
