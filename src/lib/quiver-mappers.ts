import { Chamber, Party } from "@/types";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function mapParty(partyCode: string): Party {
  switch (partyCode.toUpperCase()) {
    case "D":
      return "Democrat";
    case "R":
      return "Republican";
    default:
      return "Independent";
  }
}

export function mapChamber(house: string): Chamber {
  return house.toLowerCase() === "senate" ? "Senate" : "House";
}

export function isWithinLast90Days(
  dateString: string,
  cutoff: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
): boolean {
  const tradeDate = new Date(dateString);
  return tradeDate >= cutoff && !Number.isNaN(tradeDate.getTime());
}

export function averageExcessReturn(
  excessReturns: number[]
): number {
  if (excessReturns.length === 0) return 0;
  return (
    excessReturns.reduce((sum, value) => sum + value, 0) / excessReturns.length
  );
}

export function computeWinRate(excessReturns: number[]): number {
  if (excessReturns.length === 0) return 0;
  const wins = excessReturns.filter((value) => value > 0).length;
  return (wins / excessReturns.length) * 100;
}
