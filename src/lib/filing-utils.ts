import { EdgarFiling, FilingCategory, GroupedFilings } from "@/types";

const CATEGORY_LABELS: Record<FilingCategory, string> = {
  "material-event": "Material Events (8-K)",
  insider: "Insider Transactions (Forms 3/4/5)",
  periodic: "Quarterly & Annual Reports (10-Q / 10-K)",
  ownership: "Ownership & Proxy (13F / DEF 14A)",
  other: "Other Filings",
};

const CATEGORY_ORDER: FilingCategory[] = [
  "material-event",
  "insider",
  "periodic",
  "ownership",
  "other",
];

const RECENCY_BOOST: Partial<Record<FilingCategory, number>> = {
  "material-event": 30,
  insider: 25,
  periodic: 10,
  ownership: 5,
  other: 0,
};

export function categorizeFilingForm(form: string): FilingCategory {
  const normalized = form.toUpperCase().replace(/\//g, "");

  if (normalized.startsWith("8K") || normalized === "8K") {
    return "material-event";
  }

  if (
    normalized.startsWith("4") ||
    normalized.startsWith("3") ||
    normalized.startsWith("5") ||
    normalized === "4" ||
    normalized === "3" ||
    normalized === "5"
  ) {
    return "insider";
  }

  if (
    normalized.startsWith("10K") ||
    normalized.startsWith("10Q") ||
    normalized.startsWith("10-K") ||
    normalized.startsWith("10-Q")
  ) {
    return "periodic";
  }

  if (
    normalized.includes("13F") ||
    normalized.includes("13D") ||
    normalized.includes("13G") ||
    normalized.includes("DEF14A") ||
    normalized.includes("S1") ||
    normalized.includes("S-1")
  ) {
    return "ownership";
  }

  return "other";
}

export function getCategoryLabel(category: FilingCategory): string {
  return CATEGORY_LABELS[category];
}

export function getDaysSince(dateString: string): number {
  const filedAt = new Date(dateString);
  if (Number.isNaN(filedAt.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.floor((Date.now() - filedAt.getTime()) / (24 * 60 * 60 * 1000));
}

export function getRecencyLabel(daysAgo: number): string {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo <= 7) return "This week";
  if (daysAgo <= 30) return "This month";
  if (daysAgo <= 90) return "Last 90 days";
  return "Older";
}

function getFilingPriority(filing: EdgarFiling): number {
  const daysAgo = filing.daysAgo ?? getDaysSince(filing.filedAt);
  const boost = RECENCY_BOOST[filing.category] ?? 0;

  return boost - daysAgo;
}

export function enrichFilingMetadata(
  filing: Omit<
    EdgarFiling,
    "category" | "categoryLabel" | "daysAgo" | "recencyLabel" | "priority"
  >
): EdgarFiling {
  const category = categorizeFilingForm(filing.form);
  const daysAgo = getDaysSince(filing.filedAt);

  return {
    ...filing,
    category,
    categoryLabel: getCategoryLabel(category),
    daysAgo,
    recencyLabel: getRecencyLabel(daysAgo),
    priority: 0,
  };
}

export function rankFilings(filings: EdgarFiling[]): EdgarFiling[] {
  const enriched = filings.map((filing) => ({
    ...filing,
    daysAgo: filing.daysAgo ?? getDaysSince(filing.filedAt),
    recencyLabel:
      filing.recencyLabel ?? getRecencyLabel(getDaysSince(filing.filedAt)),
    category: filing.category ?? categorizeFilingForm(filing.form),
    categoryLabel:
      filing.categoryLabel ??
      getCategoryLabel(categorizeFilingForm(filing.form)),
  }));

  const sorted = [...enriched].sort((a, b) => {
    const priorityDiff = getFilingPriority(b) - getFilingPriority(a);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime();
  });

  return sorted.map((filing, index) => ({
    ...filing,
    priority: getFilingPriority(filing),
    isFeatured: index < 3 && (filing.daysAgo ?? 999) <= 45,
  }));
}

export function groupFilingsByCategory(filings: EdgarFiling[]): GroupedFilings[] {
  const ranked = rankFilings(filings);
  const buckets = new Map<FilingCategory, EdgarFiling[]>();

  for (const category of CATEGORY_ORDER) {
    buckets.set(category, []);
  }

  for (const filing of ranked) {
    const list = buckets.get(filing.category) ?? [];
    list.push(filing);
    buckets.set(filing.category, list);
  }

  return CATEGORY_ORDER.map((category) => ({
    category,
    label: getCategoryLabel(category),
    filings: buckets.get(category) ?? [],
  })).filter((group) => group.filings.length > 0);
}

export function getLatestFilings(
  filings: EdgarFiling[],
  limit = 3
): EdgarFiling[] {
  return rankFilings(filings)
    .filter((filing) => filing.isFeatured)
    .slice(0, limit);
}

export function prepareFilingsResponse(filings: EdgarFiling[]) {
  const ranked = rankFilings(filings);

  return {
    filings: ranked,
    latest: ranked.filter((filing) => filing.isFeatured).slice(0, 3),
    grouped: groupFilingsByCategory(ranked),
  };
}
