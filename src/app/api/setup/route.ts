import { NextResponse } from "next/server";

import {
  checkDatabaseTables,
  getSetupStatus,
  runFullSetup,
  runSchemaSetup,
} from "@/lib/setup";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET() {
  const status = getSetupStatus();
  const tables = await checkDatabaseTables();

  return NextResponse.json({
    status,
    tables,
    insightsReady: status.readyForInsights && tables.ok,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized. Send Authorization: Bearer CRON_SECRET header.",
      },
      { status: 401 }
    );
  }

  const mode = new URL(request.url).searchParams.get("mode");

  try {
    if (mode === "schema") {
      const result = await runSchemaSetup();

      return NextResponse.json({
        success: true,
        insightsReady: result.status.readyForInsights && result.tables.ok,
        ...result,
      });
    }

    const result = await runFullSetup();

    return NextResponse.json({
      success: true,
      insightsReady: result.status.readyForInsights && result.tables.ok,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Setup failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
