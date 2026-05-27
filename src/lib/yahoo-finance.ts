import { MarketQuote } from "@/types";

const YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote";

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/\./g, "-");
}

function parseQuote(raw: Record<string, unknown>): MarketQuote {
  const ticker = String(raw.symbol ?? "");

  return {
    ticker,
    price:
      typeof raw.regularMarketPrice === "number" ? raw.regularMarketPrice : null,
    changePercent:
      typeof raw.regularMarketChangePercent === "number"
        ? raw.regularMarketChangePercent
        : null,
    marketCap: typeof raw.marketCap === "number" ? raw.marketCap : null,
    currency: String(raw.currency ?? "USD"),
    shortName:
      typeof raw.shortName === "string"
        ? raw.shortName
        : typeof raw.longName === "string"
          ? raw.longName
          : null,
  };
}

export async function getMarketQuotes(
  tickers: string[]
): Promise<Record<string, MarketQuote>> {
  const uniqueTickers = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];

  if (uniqueTickers.length === 0) {
    return {};
  }

  const url = `${YAHOO_QUOTE_URL}?symbols=${encodeURIComponent(uniqueTickers.join(","))}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CapitolTrades/1.0",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance error (${response.status})`);
  }

  const payload = (await response.json()) as {
    quoteResponse?: { result?: Array<Record<string, unknown>> };
  };

  const quotes: Record<string, MarketQuote> = {};

  for (const row of payload.quoteResponse?.result ?? []) {
    const quote = parseQuote(row);
    quotes[quote.ticker.toUpperCase()] = quote;
    quotes[normalizeTicker(quote.ticker)] = quote;
  }

  for (const ticker of uniqueTickers) {
    if (!quotes[ticker]) {
      quotes[ticker] = {
        ticker,
        price: null,
        changePercent: null,
        marketCap: null,
        currency: "USD",
        shortName: null,
      };
    }
  }

  return quotes;
}

export async function getMarketQuote(ticker: string): Promise<MarketQuote> {
  const quotes = await getMarketQuotes([ticker]);
  const normalized = normalizeTicker(ticker);
  return (
    quotes[normalized] ?? {
      ticker: normalized,
      price: null,
      changePercent: null,
      marketCap: null,
      currency: "USD",
      shortName: null,
    }
  );
}
