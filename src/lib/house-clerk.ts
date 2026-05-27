import { slugify } from "@/lib/quiver-mappers";

const HOUSE_CLERK_BASE = "https://disclosures-clerk.house.gov/public_disc";

export interface HousePtrFiling {
  docId: string;
  politicianName: string;
  politicianId: string;
  stateDistrict: string;
  state: string;
  district: string | null;
  filingDate: string;
  year: number;
  filingType: string;
  pdfUrl: string;
  chamber: "House";
}

function parseStateDistrict(stateDst: string): { state: string; district: string | null } {
  const match = stateDst.match(/^([A-Z]{2})(\d{2})?$/);
  if (!match) {
    return { state: stateDst.slice(0, 2) || stateDst, district: null };
  }

  return {
    state: match[1],
    district: match[2] ?? null,
  };
}

function formatPoliticianName(first: string, last: string, prefix?: string): string {
  const base = `${first} ${last}`.trim();
  const honorific = prefix?.trim();
  if (!honorific || honorific === "Hon.") {
    return base;
  }
  return `${honorific} ${base}`;
}

function getXmlValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.trim() ?? "";
}

function parseHouseClerkXml(xml: string, year: number): HousePtrFiling[] {
  const filings: HousePtrFiling[] = [];
  const memberPattern = /<Member>[\s\S]*?<\/Member>/g;

  for (const match of xml.matchAll(memberPattern)) {
    const block = match[0];
    const filingType = getXmlValue(block, "FilingType");
    if (filingType !== "P" && filingType !== "X") {
      continue;
    }

    const docId = getXmlValue(block, "DocID");
    const filingDate = getXmlValue(block, "FilingDate");
    if (!docId || !filingDate) continue;

    const politicianName = formatPoliticianName(
      getXmlValue(block, "First"),
      getXmlValue(block, "Last"),
      getXmlValue(block, "Prefix")
    );
    const stateDistrict = getXmlValue(block, "StateDst");
    const { state, district } = parseStateDistrict(stateDistrict);

    filings.push({
      docId,
      politicianName,
      politicianId: slugify(politicianName),
      stateDistrict,
      state,
      district,
      filingDate,
      year,
      filingType,
      pdfUrl: `${HOUSE_CLERK_BASE}/ptr-pdfs/${year}/${docId}.pdf`,
      chamber: "House",
    });
  }

  return filings.sort(
    (a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime()
  );
}

async function fetchHouseClerkXml(year: number): Promise<string> {
  const response = await fetch(
    `${HOUSE_CLERK_BASE}/financial-pdfs/${year}FD.xml`,
    {
      headers: {
        Accept: "application/xml, text/xml",
        "User-Agent": "TradeTheHill/1.0 (research@tradethehill.org)",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    throw new Error(
      `House Clerk disclosure index error (${response.status}): ${response.statusText}`
    );
  }

  return response.text();
}

export async function fetchHousePtrFilings(options: {
  years?: number[];
  limit?: number;
} = {}): Promise<HousePtrFiling[]> {
  const currentYear = new Date().getFullYear();
  const years = options.years ?? [currentYear, currentYear - 1];
  const merged = new Map<string, HousePtrFiling>();

  for (const year of years) {
    try {
      const xml = await fetchHouseClerkXml(year);
      for (const filing of parseHouseClerkXml(xml, year)) {
        merged.set(`${filing.docId}-${filing.year}`, filing);
      }
    } catch (error) {
      console.error(
        `House Clerk PTR index failed for ${year}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  const filings = [...merged.values()].sort(
    (a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime()
  );

  return options.limit ? filings.slice(0, options.limit) : filings;
}

export function isHouseClerkAvailable(): boolean {
  return true;
}
