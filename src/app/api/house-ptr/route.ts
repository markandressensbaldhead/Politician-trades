import { NextResponse } from "next/server";

import { fetchHousePtrFilings } from "@/lib/house-clerk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "20");

  try {
    const filings = await fetchHousePtrFilings({
      limit: Number.isFinite(limit) ? Math.min(limit, 100) : 20,
    });

    return NextResponse.json({
      configured: true,
      count: filings.length,
      filings,
      source: "house_clerk",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch House PTR filings";

    return NextResponse.json({ configured: true, error: message, filings: [] }, { status: 502 });
  }
}
