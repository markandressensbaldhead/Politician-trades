import { NextResponse } from "next/server";

import { buildCsv, profileTradeToCsvRow, slugifyFilename, unifiedTradeToCsvRow } from "@/lib/csv-export";
import { translateTradeToInvestment } from "@/lib/filing-translator";
import { getPoliticianProfile } from "@/lib/politician";
import { loadUnifiedTrades } from "@/lib/unified-trades";

function csvResponse(filename: string, csv: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const politicianId = searchParams.get("politician");
  const ticker = searchParams.get("ticker")?.toUpperCase();
  const scope = searchParams.get("scope");

  try {
    if (politicianId) {
      const profile = await getPoliticianProfile(politicianId);

      if (!profile) {
        return NextResponse.json(
          { error: "Politician not found" },
          { status: 404 }
        );
      }

      const rows = profile.trades.map((trade) =>
        profileTradeToCsvRow(
          profile.name,
          profile.party,
          profile.chamber,
          trade,
          translateTradeToInvestment(
            trade,
            profile.name,
            trade.secFilings ?? []
          ).plainSummary
        )
      );

      return csvResponse(
        `${slugifyFilename(profile.name)}-trades.csv`,
        buildCsv(rows)
      );
    }

    if (ticker) {
      const { trades } = await loadUnifiedTrades();
      const filtered = trades.filter((trade) => trade.ticker === ticker);
      const rows = filtered.map((trade) => unifiedTradeToCsvRow(trade));

      return csvResponse(`${ticker}-congress-trades.csv`, buildCsv(rows));
    }

    if (scope === "all" || scope === "feed") {
      const { trades } = await loadUnifiedTrades();
      const limit = scope === "feed" ? 500 : 5000;
      const rows = trades.slice(0, limit).map((trade) => unifiedTradeToCsvRow(trade));

      return csvResponse("tradethehill-export.csv", buildCsv(rows));
    }

    return NextResponse.json(
      {
        error:
          "Provide politician=, ticker=, or scope=all|feed query parameter",
      },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to export trades";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
