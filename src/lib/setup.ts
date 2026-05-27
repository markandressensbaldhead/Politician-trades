import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";

import { isSupabaseConfigured } from "@/lib/supabase/server";

export interface SetupStatus {
  supabase: boolean;
  supabaseServiceRole: boolean;
  anthropic: boolean;
  quiverQuant: boolean;
  databaseUrl: boolean;
  cronSecret: boolean;
  resend: boolean;
  appUrl: boolean;
  readyForInsights: boolean;
  missing: string[];
}

export function getSetupStatus(): SetupStatus {
  const missing: string[] = [];

  const supabase = isSupabaseConfigured();
  const supabaseServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const quiverQuant = Boolean(process.env.QUIVERQUANT_API_KEY);
  const databaseUrl = Boolean(process.env.DATABASE_URL);
  const cronSecret = Boolean(process.env.CRON_SECRET);
  const resend = Boolean(process.env.RESEND_API_KEY);
  const appUrl = Boolean(process.env.NEXT_PUBLIC_APP_URL);

  if (!supabase) missing.push("SUPABASE_URL + SUPABASE_ANON_KEY");
  if (!supabaseServiceRole) missing.push("SUPABASE_SERVICE_ROLE_KEY (recommended)");
  if (!anthropic) missing.push("ANTHROPIC_API_KEY");
  if (!databaseUrl) missing.push("DATABASE_URL (for one-click table setup)");

  const readyForInsights = supabase && anthropic;

  return {
    supabase,
    supabaseServiceRole,
    anthropic,
    quiverQuant,
    databaseUrl,
    cronSecret,
    resend,
    appUrl,
    readyForInsights,
    missing,
  };
}

export async function checkDatabaseTables(): Promise<{
  ok: boolean;
  missingTables: string[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, missingTables: ["all"], error: "Supabase not configured" };
  }

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = getSupabaseServerClient();
  const tables = ["congress_trades", "politician_insights", "subscriptions"];
  const missingTables: string[] = [];

  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(1);

    if (error) {
      missingTables.push(table);
    }
  }

  return {
    ok: missingTables.length === 0,
    missingTables,
    error:
      missingTables.length > 0
        ? `Missing tables: ${missingTables.join(", ")}`
        : undefined,
  };
}

function isIgnorableSqlError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already exists") ||
    lower.includes("duplicate key") ||
    lower.includes("multiple primary keys")
  );
}

export async function runSupabaseSchema(): Promise<{ executed: number }> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Add your Supabase Postgres connection string to Vercel."
    );
  }

  const schemaPath = join(process.cwd(), "supabase", "schema.sql");
  const sql = readFileSync(schemaPath, "utf8");

  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(
      (statement) =>
        statement.length > 0 && !statement.startsWith("--")
    );

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  let executed = 0;

  try {
    for (const statement of statements) {
      try {
        await client.query(`${statement};`);
        executed += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown SQL error";

        if (!isIgnorableSqlError(message)) {
          throw new Error(`Schema statement failed: ${message}`);
        }
      }
    }
  } finally {
    await client.end();
  }

  return { executed };
}

export async function runFullSetup(): Promise<{
  status: SetupStatus;
  tables: Awaited<ReturnType<typeof checkDatabaseTables>>;
  schema?: { executed: number };
}> {
  const status = getSetupStatus();

  if (!status.readyForInsights) {
    throw new Error(
      `Missing required configuration: ${status.missing.join(", ")}`
    );
  }

  let schema: { executed: number } | undefined;

  if (process.env.DATABASE_URL) {
    schema = await runSupabaseSchema();
  }

  const tables = await checkDatabaseTables();

  if (!tables.ok && !process.env.DATABASE_URL) {
    throw new Error(
      "Database tables are missing. Add DATABASE_URL to Vercel and run setup again, or paste supabase/schema.sql into the Supabase SQL Editor."
    );
  }

  return { status, tables, schema };
}
