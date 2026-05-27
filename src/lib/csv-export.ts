import { ProfileTrade, UnifiedCongressTrade } from "@/types";
import { RecentCongressTrade } from "@/lib/congress-data";

export interface CsvExportRow {
  politician: string;
  party: string;
  chamber: string;
  ticker: string;
  company: string;
  type: string;
  amount: string;
  tradeDate: string;
  filingDate: string;
  disclosureLagDays: string;
  sector: string;
  excessReturnVsSpy: string;
  plainSummary: string;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function rowToLine(row: CsvExportRow): string {
  return [
    row.politician,
    row.party,
    row.chamber,
    row.ticker,
    row.company,
    row.type,
    row.amount,
    row.tradeDate,
    row.filingDate,
    row.disclosureLagDays,
    row.sector,
    row.excessReturnVsSpy,
    row.plainSummary,
  ]
    .map((cell) => escapeCsv(cell))
    .join(",");
}

const CSV_HEADER =
  "Politician,Party,Chamber,Ticker,Company,Type,Amount,Trade Date,Filing Date,Disclosure Lag (Days),Sector,Excess Return vs SPY (%),Plain English Summary";

export function buildCsv(rows: CsvExportRow[]): string {
  return [CSV_HEADER, ...rows.map(rowToLine)].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function unifiedTradeToCsvRow(
  trade: UnifiedCongressTrade,
  plainSummary?: string
): CsvExportRow {
  return {
    politician: trade.politicianName,
    party: trade.party,
    chamber: trade.chamber,
    ticker: trade.ticker,
    company: trade.company,
    type: trade.type,
    amount: trade.amount,
    tradeDate: trade.tradeDate,
    filingDate: trade.filingDate ?? "",
    disclosureLagDays:
      trade.disclosureLagDays != null ? String(trade.disclosureLagDays) : "",
    sector: trade.sector,
    excessReturnVsSpy:
      trade.excessReturn != null ? trade.excessReturn.toFixed(2) : "",
    plainSummary: plainSummary ?? "",
  };
}

export function recentTradeToCsvRow(trade: RecentCongressTrade): CsvExportRow {
  return {
    politician: trade.politicianName,
    party: trade.party,
    chamber: trade.chamber,
    ticker: trade.ticker,
    company: trade.company,
    type: trade.type,
    amount: trade.amount,
    tradeDate: trade.date,
    filingDate: trade.filingDate ?? "",
    disclosureLagDays:
      trade.disclosureLagDays != null ? String(trade.disclosureLagDays) : "",
    sector: trade.sector,
    excessReturnVsSpy:
      trade.excessReturn != null ? trade.excessReturn.toFixed(2) : "",
    plainSummary: "",
  };
}

export function profileTradeToCsvRow(
  politicianName: string,
  party: string,
  chamber: string,
  trade: ProfileTrade,
  plainSummary?: string
): CsvExportRow {
  const lag =
    trade.filingDate && trade.tradeDate
      ? Math.max(
          0,
          Math.floor(
            (new Date(trade.filingDate).getTime() -
              new Date(trade.tradeDate).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        )
      : null;

  return {
    politician: politicianName,
    party,
    chamber,
    ticker: trade.ticker,
    company: trade.company,
    type: trade.type,
    amount: trade.amount,
    tradeDate: trade.tradeDate,
    filingDate: trade.filingDate,
    disclosureLagDays: lag != null ? String(lag) : "",
    sector: trade.sector ?? "",
    excessReturnVsSpy:
      trade.excessReturn != null ? trade.excessReturn.toFixed(2) : "",
    plainSummary: plainSummary ?? trade.sourceNote ?? "",
  };
}

export function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
