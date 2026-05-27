import crypto from "crypto";

const SNAPTRADE_BASE = "https://api.snaptrade.com/api/v1";

export interface SnapTradeCredentials {
  userId: string;
  userSecret: string;
}

export function isSnapTradeConfigured(): boolean {
  return Boolean(
    process.env.SNAPTRADE_CLIENT_ID && process.env.SNAPTRADE_CONSUMER_KEY
  );
}

function getClientId(): string {
  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  if (!clientId) {
    throw new Error("SNAPTRADE_CLIENT_ID is not configured");
  }
  return clientId;
}

function getConsumerKey(): string {
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;
  if (!consumerKey) {
    throw new Error("SNAPTRADE_CONSUMER_KEY is not configured");
  }
  return consumerKey;
}

function jsonStringifyOrder(obj: Record<string, unknown>): string {
  const allKeys: string[] = [];
  const seen: Record<string, null> = {};

  JSON.stringify(obj, (key, value) => {
    if (!(key in seen)) {
      allKeys.push(key);
      seen[key] = null;
    }
    return value;
  });

  allKeys.sort();
  return JSON.stringify(obj, allKeys);
}

function computeSignature(
  path: string,
  query: string,
  body: Record<string, unknown> | null
): string {
  const sigObject = {
    content: body,
    path: `/api/v1${path}`,
    query,
  };

  const sigContent = jsonStringifyOrder(sigObject);
  return crypto
    .createHmac("sha256", getConsumerKey())
    .update(sigContent)
    .digest("base64");
}

async function snapTradeRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  options: {
    userId?: string;
    userSecret?: string;
    body?: Record<string, unknown> | null;
    extraQuery?: Record<string, string>;
  } = {}
): Promise<T> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const queryParams = new URLSearchParams({
    clientId: getClientId(),
    timestamp,
  });

  if (options.userId) queryParams.set("userId", options.userId);
  if (options.userSecret) queryParams.set("userSecret", options.userSecret);

  if (options.extraQuery) {
    for (const [key, value] of Object.entries(options.extraQuery)) {
      queryParams.set(key, value);
    }
  }

  const query = queryParams.toString();
  const body =
    method === "GET" || method === "DELETE"
      ? null
      : options.body ?? null;

  const signature = computeSignature(path, query, body);

  const response = await fetch(`${SNAPTRADE_BASE}${path}?${query}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Signature: signature,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : typeof data === "object" &&
            data &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : text || response.statusText;

    throw new Error(`SnapTrade API error (${response.status}): ${message}`);
  }

  return data as T;
}

export async function registerSnapTradeUser(
  userId: string
): Promise<SnapTradeCredentials> {
  const data = await snapTradeRequest<{ userId: string; userSecret: string }>(
    "POST",
    "/snapTrade/registerUser",
    { body: { userId } }
  );

  return {
    userId: data.userId,
    userSecret: data.userSecret,
  };
}

export async function getRobinhoodConnectionUrl(
  credentials: SnapTradeCredentials,
  redirectUrl: string
): Promise<string> {
  const data = await snapTradeRequest<{ redirectURI: string }>(
    "POST",
    "/snapTrade/login",
    {
      userId: credentials.userId,
      userSecret: credentials.userSecret,
      body: {
        broker: "ROBINHOOD",
        connectionType: "read",
        immediateRedirect: true,
        customRedirect: redirectUrl,
        showCloseButton: true,
        darkMode: true,
        connectionPortalVersion: "v4",
      },
    }
  );

  if (!data.redirectURI) {
    throw new Error("SnapTrade did not return a connection URL");
  }

  return data.redirectURI;
}

interface SnapTradeAuthorization {
  id: string;
  disabled?: boolean;
  brokerage?: { slug?: string; name?: string };
}

interface SnapTradeAccount {
  id: string;
  name?: string;
  institution_name?: string;
}

interface SnapTradePosition {
  units?: number;
  fractional_units?: number;
  average_purchase_price?: number;
  symbol?: {
    symbol?: {
      raw_symbol?: string;
      symbol?: string;
      exchange?: { suffix?: string; code?: string };
    };
  };
}

function extractTicker(position: SnapTradePosition): string | null {
  const symbolNode = position.symbol?.symbol;
  const raw =
    symbolNode?.raw_symbol?.trim().toUpperCase() ||
    symbolNode?.symbol?.trim().toUpperCase();

  if (!raw) return null;

  const suffix = symbolNode?.exchange?.suffix ?? "";
  if (suffix && raw.endsWith(suffix.toUpperCase())) {
    return raw.slice(0, -suffix.length).replace(/\.$/, "");
  }

  return raw.replace(/[^A-Z0-9.]/g, "").slice(0, 6) || null;
}

export async function fetchSnapTradeHoldings(
  credentials: SnapTradeCredentials
): Promise<
  Array<{
    ticker: string;
    quantity: number;
    averageCost: number | null;
    accountName?: string;
  }>
> {
  const authorizations = await snapTradeRequest<SnapTradeAuthorization[]>(
    "GET",
    "/authorizations",
    credentials
  );

  const aggregated = new Map<
    string,
    { quantity: number; costTotal: number; costQty: number; accountName?: string }
  >();

  for (const authorization of authorizations) {
    if (authorization.disabled) continue;

    let accounts: SnapTradeAccount[] = [];

    try {
      accounts = await snapTradeRequest<SnapTradeAccount[]>(
        "GET",
        `/authorizations/${authorization.id}/accounts`,
        credentials
      );
    } catch {
      continue;
    }

    for (const account of accounts) {
      let positions: SnapTradePosition[] = [];

      try {
        positions = await snapTradeRequest<SnapTradePosition[]>(
          "GET",
          `/accounts/${account.id}/positions`,
          credentials
        );
      } catch {
        continue;
      }

      for (const position of positions) {
        const ticker = extractTicker(position);
        const units = position.units ?? position.fractional_units ?? 0;

        if (!ticker || units <= 0) continue;

        const current = aggregated.get(ticker) ?? {
          quantity: 0,
          costTotal: 0,
          costQty: 0,
          accountName: account.name ?? account.institution_name,
        };

        current.quantity += units;

        if (position.average_purchase_price != null) {
          current.costTotal += position.average_purchase_price * units;
          current.costQty += units;
        }

        aggregated.set(ticker, current);
      }
    }
  }

  return [...aggregated.entries()]
    .map(([ticker, stats]) => ({
      ticker,
      quantity: Number(stats.quantity.toFixed(4)),
      averageCost:
        stats.costQty > 0
          ? Number((stats.costTotal / stats.costQty).toFixed(2))
          : null,
      accountName: stats.accountName,
    }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function createSnapTradeUserId(): string {
  return crypto.randomUUID();
}
