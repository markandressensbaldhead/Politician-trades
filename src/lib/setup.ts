import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";

import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getDatabaseUrl,
  getSchemaDatabaseUrl,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

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
  const supabaseServiceRole = Boolean(getSupabaseServiceRoleKey());
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const quiverQuant = Boolean(process.env.QUIVERQUANT_API_KEY);
  const databaseUrl = Boolean(getDatabaseUrl());
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

function normalizePgConnectionString(connectionString: string): string {
  const url = new URL(connectionString.replace(/^postgres:\/\//, "postgresql://"));

  url.searchParams.delete("sslmode");
  url.searchParams.set("sslmode", "no-verify");

  return url.toString().replace(/^postgresql:\/\//, "postgres://");
}

function createSchemaPgClient(connectionString: string): pg.Client {
  const normalized = normalizePgConnectionString(connectionString);
  const usesSsl =
    !normalized.includes("localhost") && !normalized.includes("127.0.0.1");

  return new pg.Client({
    connectionString: normalized,
    ssl: usesSsl ? { rejectUnauthorized: false } : undefined,
  });
}

function stripSqlComments(sql: string): string {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function splitSqlStatements(sql: string): string[] {
  return stripSqlComments(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

export async function runSupabaseSchema(): Promise<{ executed: number }> {
  const connectionString = getSchemaDatabaseUrl();

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Add your Supabase Postgres connection string to Vercel."
    );
  }

  const schemaPath = join(process.cwd(), "supabase", "schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  const statements = splitSqlStatements(sql);

  const client = createSchemaPgClient(connectionString);

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
          throw new Error(
            `Schema statement failed (${executed + 1}/${statements.length}): ${message}`
          );
        }
      }
    }

    try {
      await client.query("NOTIFY pgrst, 'reload schema';");
    } catch {
      // PostgREST reload is best-effort; tables may take a few seconds otherwise.
    }
  } finally {
    await client.end();
  }

  return { executed };
}

export async function runSchemaSetup(): Promise<{
  status: SetupStatus;
  tables: Awaited<ReturnType<typeof checkDatabaseTables>>;
  schema: { executed: number };
}> {
  const status = getSetupStatus();

  if (!status.supabase) {
    throw new Error(
      `Missing required configuration: ${status.missing.join(", ")}`
    );
  }

  if (!getDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not configured. Connect Supabase in Vercel or add POSTGRES_URL."
    );
  }

  const schema = await runSupabaseSchema();
  const tables = await checkDatabaseTables();

  return { status, tables, schema };
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

  const { schema, tables } = await runSchemaSetup();

  if (!tables.ok) {
    throw new Error(
      "Database tables are missing after schema setup. Check Supabase logs or paste supabase/schema.sql into the SQL Editor."
    );
  }

  return { status, tables, schema };
}
