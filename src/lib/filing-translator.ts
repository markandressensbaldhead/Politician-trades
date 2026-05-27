import { EdgarFiling, InvestmentSummary, ProfileTrade } from "@/types";
import { formatDate } from "@/lib/utils";

function normalizeAction(type: string): InvestmentSummary["action"] {
  const lower = type.toLowerCase();

  if (lower.includes("purchase") || lower.includes("buy")) {
    return "purchase";
  }

  if (lower.includes("sale") || lower.includes("sell")) {
    return "sale";
  }

  if (lower.includes("holding")) {
    return "holding";
  }

  if (lower.includes("corporate") || lower.includes("merger")) {
    return "corporate-event";
  }

  if (lower.includes("income")) {
    return "income";
  }

  return "other";
}

function actionVerb(action: InvestmentSummary["action"]): string {
  switch (action) {
    case "purchase":
      return "bought";
    case "sale":
      return "sold";
    case "holding":
      return "reported holding";
    case "corporate-event":
      return "corporate event involving";
    case "income":
      return "reported income from";
    default:
      return "disclosed activity in";
  }
}

function actionLabel(action: InvestmentSummary["action"]): string {
  switch (action) {
    case "purchase":
      return "Purchase";
    case "sale":
      return "Sale";
    case "holding":
      return "Holding";
    case "corporate-event":
      return "Corporate Event";
    case "income":
      return "Income";
    default:
      return "Disclosure";
  }
}

function parseForm4Excerpt(excerpt?: string): {
  shares?: string;
  price?: string;
  transactionDate?: string;
} {
  if (!excerpt) {
    return {};
  }

  const sharesMatch = excerpt.match(
    /(?:shares?|securities)\s*(?:acquired|sold|transacted)?[:\s]*([\d,]+)/i
  );
  const priceMatch = excerpt.match(
    /\$\s*([\d,]+(?:\.\d+)?)\s*(?:per share|price)?/i
  );
  const dateMatch = excerpt.match(
    /transaction date[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i
  );

  return {
    shares: sharesMatch?.[1],
    price: priceMatch?.[1],
    transactionDate: dateMatch?.[1],
  };
}

function describeFilingContext(
  filing: EdgarFiling,
  trade?: ProfileTrade
): string {
  const form = filing.form.replace(/\/A$/, "");

  if (filing.category === "insider") {
    const parsed = parseForm4Excerpt(filing.excerpt);
    const parts = [`SEC Form ${form} filed ${formatDate(filing.filedAt)}`];

    if (parsed.shares) {
      parts.push(`${parsed.shares} shares`);
    }

    if (parsed.price) {
      parts.push(`at $${parsed.price}/share`);
    }

    if (trade) {
      parts.push(`linked to ${trade.ticker} disclosure`);
    }

    return parts.join(" · ");
  }

  if (filing.category === "material-event") {
    return `SEC Form ${form} (material event) for ${filing.entityName} filed ${formatDate(filing.filedAt)} — context for ${trade?.ticker ?? filing.ticker ?? "related"} holdings`;
  }

  if (filing.category === "periodic") {
    return `SEC Form ${form} (periodic report) for ${filing.entityName} — not a personal trade, but covers ${trade?.ticker ?? filing.ticker ?? "issuer"} financials`;
  }

  return `SEC Form ${form} for ${filing.entityName} filed ${formatDate(filing.filedAt)}`;
}

export function translateTradeToInvestment(
  trade: ProfileTrade,
  politicianName: string,
  linkedFilings: EdgarFiling[] = trade.secFilings ?? []
): InvestmentSummary {
  const action = normalizeAction(trade.type);
  const verb = actionVerb(action);
  const asset = `${trade.company} (${trade.ticker})`;
  const primaryFiling = linkedFilings[0];

  let amount = trade.amount;
  if (primaryFiling?.category === "insider") {
    const parsed = parseForm4Excerpt(primaryFiling.excerpt);
    if (parsed.shares && parsed.price) {
      amount = `${parsed.shares} shares @ $${parsed.price}`;
    } else if (parsed.shares) {
      amount = `${parsed.shares} shares (${trade.amount})`;
    }
  }

  const plainSummary = [
    `${politicianName} ${verb}`,
    amount,
    `of ${asset}`,
    `on ${formatDate(trade.tradeDate)}.`,
    `Disclosed ${formatDate(trade.filingDate)}.`,
  ].join(" ");

  return {
    id: trade.id,
    ticker: trade.ticker,
    asset: trade.company,
    action,
    actionLabel: actionLabel(action),
    amount,
    tradeDate: trade.tradeDate,
    filedDate: trade.filingDate,
    plainSummary,
    filingContext: primaryFiling
      ? describeFilingContext(primaryFiling, trade)
      : undefined,
    filingIds: linkedFilings.map((filing) => filing.id),
    source: linkedFilings.length > 0 ? "both" : "disclosed-trade",
    sector: trade.sector,
    sourceNote: trade.sourceNote,
  };
}

export function translateFilingOnlyInvestment(
  filing: EdgarFiling,
  politicianName: string
): InvestmentSummary | null {
  if (filing.category === "insider" && filing.source === "politician-search") {
    const parsed = parseForm4Excerpt(filing.excerpt);
    const ticker = filing.ticker ?? "Unknown";
    const amount =
      parsed.shares && parsed.price
        ? `${parsed.shares} shares @ $${parsed.price}`
        : parsed.shares
          ? `${parsed.shares} shares`
          : "Amount not stated in filing";

    return {
      id: `filing-${filing.id}`,
      ticker,
      asset: filing.entityName,
      action: "other",
      actionLabel: "SEC Insider Filing",
      amount,
      tradeDate: parsed.transactionDate ?? filing.filedAt,
      filedDate: filing.filedAt,
      plainSummary: `${politicianName} appears in SEC Form ${filing.form.replace(/\/A$/, "")} for ${filing.entityName}${filing.ticker ? ` (${filing.ticker})` : ""} — ${amount}. Filed ${formatDate(filing.filedAt)}.`,
      filingContext: describeFilingContext(filing),
      filingIds: [filing.id],
      source: "sec-filing",
    };
  }

  return null;
}

export function buildInvestmentSummaries(
  politicianName: string,
  trades: ProfileTrade[],
  filings: EdgarFiling[]
): InvestmentSummary[] {
  const usedFilingIds = new Set<string>();
  const summaries: InvestmentSummary[] = [];

  for (const trade of trades) {
    const linked =
      trade.secFilings ??
      filings.filter(
        (filing) =>
          filing.ticker?.toUpperCase() === trade.ticker.toUpperCase() ||
          trade.secFilings?.some((item) => item.id === filing.id)
      );

    const summary = translateTradeToInvestment(trade, politicianName, linked);
    summaries.push(summary);

    for (const filing of linked) {
      usedFilingIds.add(filing.id);
    }
  }

  for (const filing of filings) {
    if (usedFilingIds.has(filing.id)) {
      continue;
    }

    const filingOnly = translateFilingOnlyInvestment(filing, politicianName);
    if (filingOnly) {
      summaries.push(filingOnly);
      continue;
    }

    if (filing.category === "material-event" || filing.category === "insider") {
      summaries.push({
        id: `filing-${filing.id}`,
        ticker: filing.ticker ?? "—",
        asset: filing.entityName,
        action: "other",
        actionLabel: filing.categoryLabel,
        amount: null,
        tradeDate: filing.filedAt,
        filedDate: filing.filedAt,
        plainSummary: `${filing.entityName}${filing.ticker ? ` (${filing.ticker})` : ""}: ${filing.categoryLabel.toLowerCase()} filed ${formatDate(filing.filedAt)}. No matching personal trade amount in disclosures — review linked SEC document.`,
        filingContext: describeFilingContext(filing),
        filingIds: [filing.id],
        source: "sec-filing",
      });
    }
  }

  return summaries.sort(
    (a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
  );
}

export function enrichFilingsWithTranslations(
  filings: EdgarFiling[],
  trades: ProfileTrade[],
  politicianName: string
): EdgarFiling[] {
  const tradeByTicker = new Map(
    trades.map((trade) => [trade.ticker.toUpperCase(), trade])
  );

  return filings.map((filing) => {
    const trade =
      tradeByTicker.get(filing.ticker?.toUpperCase() ?? "") ??
      trades.find((item) =>
        item.secFilings?.some((linked) => linked.id === filing.id)
      );

    if (trade) {
      const summary = translateTradeToInvestment(
        trade,
        politicianName,
        [filing, ...(trade.secFilings ?? [])].filter(
          (item, index, arr) => arr.findIndex((f) => f.id === item.id) === index
        )
      );

      return {
        ...filing,
        investmentSummary: summary,
      };
    }

    const filingOnly = translateFilingOnlyInvestment(filing, politicianName);

    return filingOnly
      ? { ...filing, investmentSummary: filingOnly }
      : filing;
  });
}
