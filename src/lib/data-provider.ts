import type { CongressDataProvider } from "@/lib/congress-trade-source";

export function getProviderLabel(provider: CongressDataProvider): string {
  switch (provider) {
    case "unusual_whales":
      return "Unusual Whales";
    case "quiverquant":
      return "QuiverQuant";
    default:
      return "Demo";
  }
}

export function getLiveDataSetupMessage(): string {
  return "Demo data — add UNUSUAL_WHALES_API_KEY (recommended) or QUIVERQUANT_API_KEY for live congressional trades.";
}

export function getProviderAttribution(provider: CongressDataProvider): string | null {
  switch (provider) {
    case "unusual_whales":
      return "Congressional trade data powered by Unusual Whales.";
    case "quiverquant":
      return "Congressional trade data powered by QuiverQuant.";
    default:
      return null;
  }
}
