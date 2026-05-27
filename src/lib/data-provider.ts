import type { CongressDataProvider } from "@/lib/congress-trade-source";

export function getProviderLabel(provider: CongressDataProvider): string {
  switch (provider) {
    case "unusual_whales":
      return "Unusual Whales";
    case "quiverquant":
      return "QuiverQuant";
    case "fmp":
      return "FMP";
    case "mixed":
      return "Multi-source";
    default:
      return "Demo";
  }
}

export function getLiveDataSetupMessage(): string {
  return "Demo data — add UNUSUAL_WHALES_API_KEY (primary), FMP_API_KEY, or QUIVERQUANT_API_KEY for live congressional trades.";
}

export function getProviderAttribution(provider: CongressDataProvider): string | null {
  switch (provider) {
    case "unusual_whales":
      return "Congressional trade data powered by Unusual Whales.";
    case "quiverquant":
      return "Congressional trade data powered by QuiverQuant.";
    case "fmp":
      return "Congressional trade data powered by Financial Modeling Prep.";
    case "mixed":
      return "Congressional trade data merged from Unusual Whales, FMP, QuiverQuant, and Capitol Trades.";
    default:
      return null;
  }
}

export function getDataSourceStackMessage(): string {
  return "Live disclosures via Unusual Whales, FMP, QuiverQuant, Capitol Trades, and official House Clerk PTR filings.";
}
