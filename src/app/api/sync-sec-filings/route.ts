import { NextResponse } from "next/server";

import { assertSiteOperational } from "@/lib/operational-guard";
import { syncSecFilingsAndLinkTrades } from "@/lib/sync-sec-filings";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  const blocked = assertSiteOperational();
  if (blocked) return blocked;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncSecFilingsAndLinkTrades();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync SEC filings";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
