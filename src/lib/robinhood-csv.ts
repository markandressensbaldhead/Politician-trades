import { PortfolioHolding } from "@/types/portfolio";

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;

  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned || cleaned === "—" || cleaned === "-") return null;

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);

  for (const candidate of candidates) {
    const index = normalized.findIndex(
      (header) => header === candidate || header.includes(candidate)
    );
    if (index >= 0) return index;
  }

  return -1;
}

function isBuySide(value: string | undefined): boolean {
  const side = value?.trim().toLowerCase() ?? "";
  return (
    side.includes("buy") ||
    side === "b" ||
    side.includes("purchase") ||
    side.includes("long")
  );
}

function isSellSide(value: string | undefined): boolean {
  const side = value?.trim().toLowerCase() ?? "";
  return (
    side.includes("sell") ||
    side === "s" ||
    side.includes("sale") ||
    side.includes("short")
  );
}

function cleanTicker(raw: string | undefined): string | null {
  if (!raw) return null;

  const ticker = raw.trim().toUpperCase().replace(/[^A-Z0-9.]/g, "");
  if (!ticker || ticker.length > 6) return null;
  if (["CASH", "TOTAL", "SYMBOL", "TYPE"].includes(ticker)) return null;

  return ticker;
}

function holdingsFromSnapshot(
  headers: string[],
  rows: string[][]
): PortfolioHolding[] {
  const symbolIndex = findColumnIndex(headers, [
    "symbol",
    "ticker",
    "ticker symbol",
    "instrument",
  ]);
  const quantityIndex = findColumnIndex(headers, [
    "quantity",
    "shares",
    "units",
    "qty",
    "amount",
  ]);
  const costIndex = findColumnIndex(headers, [
    "average cost",
    "avg cost",
    "cost basis",
    "average price",
    "avg price",
    "price",
  ]);

  if (symbolIndex < 0 || quantityIndex < 0) {
    return [];
  }

  const holdings = new Map<string, PortfolioHolding>();

  for (const row of rows) {
    const ticker = cleanTicker(row[symbolIndex]);
    const quantity = parseNumber(row[quantityIndex]);

    if (!ticker || quantity == null || quantity <= 0) continue;

    const averageCost =
      costIndex >= 0 ? parseNumber(row[costIndex]) ?? undefined : undefined;

    holdings.set(ticker, {
      ticker,
      quantity,
      averageCost,
      source: "robinhood_csv",
    });
  }

  return [...holdings.values()];
}

function holdingsFromTransactions(
  headers: string[],
  rows: string[][]
): PortfolioHolding[] {
  const symbolIndex = findColumnIndex(headers, [
    "symbol",
    "ticker",
    "ticker symbol",
    "instrument",
    "chain symbol",
  ]);
  const quantityIndex = findColumnIndex(headers, [
    "quantity",
    "shares",
    "units",
    "processed quantity",
    "order quantity",
    "qty",
  ]);
  const sideIndex = findColumnIndex(headers, [
    "side",
    "type",
    "direction",
    "transaction",
  ]);
  const priceIndex = findColumnIndex(headers, [
    "average price",
    "price",
    "spot price",
    "avg price",
  ]);

  if (symbolIndex < 0 || quantityIndex < 0) {
    return [];
  }

  const positions = new Map<
    string,
    { quantity: number; costTotal: number; costQty: number }
  >();

  for (const row of rows) {
    const ticker = cleanTicker(row[symbolIndex]);
    const quantity = parseNumber(row[quantityIndex]);

    if (!ticker || quantity == null || quantity <= 0) continue;

    const sideValue = sideIndex >= 0 ? row[sideIndex] : row[1];
    const signedQty = isSellSide(sideValue)
      ? -quantity
      : isBuySide(sideValue)
        ? quantity
        : quantity;

    const current = positions.get(ticker) ?? {
      quantity: 0,
      costTotal: 0,
      costQty: 0,
    };

    current.quantity += signedQty;

    const price = priceIndex >= 0 ? parseNumber(row[priceIndex]) : null;
    if (signedQty > 0 && price != null) {
      current.costTotal += price * signedQty;
      current.costQty += signedQty;
    }

    positions.set(ticker, current);
  }

  return [...positions.entries()]
    .filter(([, position]) => position.quantity > 0.0001)
    .map(([ticker, position]) => ({
      ticker,
      quantity: Number(position.quantity.toFixed(4)),
      averageCost:
        position.costQty > 0
          ? Number((position.costTotal / position.costQty).toFixed(2))
          : null,
      source: "robinhood_csv" as const,
    }));
}

export interface RobinhoodImportResult {
  holdings: PortfolioHolding[];
  format: "snapshot" | "transactions" | "unknown";
  rowsParsed: number;
}

export function parseRobinhoodCsv(csvText: string): RobinhoodImportResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file is empty or missing data rows.");
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);

  const snapshot = holdingsFromSnapshot(headers, rows);
  if (snapshot.length > 0) {
    return {
      holdings: snapshot,
      format: "snapshot",
      rowsParsed: rows.length,
    };
  }

  const transactions = holdingsFromTransactions(headers, rows);
  if (transactions.length > 0) {
    return {
      holdings: transactions,
      format: "transactions",
      rowsParsed: rows.length,
    };
  }

  throw new Error(
    "Could not parse Robinhood CSV. Export from Robinhood (Account → Download my data) or add columns for Symbol and Quantity."
  );
}
