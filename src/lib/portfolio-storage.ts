import { PortfolioHolding, SavedPortfolio } from "@/types/portfolio";

const STORAGE_KEY = "capitol-trades-portfolio";

export function loadPortfolio(): SavedPortfolio | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedPortfolio;
    if (!parsed?.holdings || !Array.isArray(parsed.holdings)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function savePortfolio(portfolio: SavedPortfolio): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

export function clearPortfolio(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function mergeHoldings(
  existing: PortfolioHolding[],
  incoming: PortfolioHolding[]
): PortfolioHolding[] {
  const map = new Map<string, PortfolioHolding>();

  for (const holding of existing) {
    map.set(holding.ticker.toUpperCase(), holding);
  }

  for (const holding of incoming) {
    map.set(holding.ticker.toUpperCase(), holding);
  }

  return [...map.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
}
