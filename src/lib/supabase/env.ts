function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value && value.trim()));
}

export function getSupabaseUrl(): string | undefined {
  return firstDefined(
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export function getSupabaseAnonKey(): string | undefined {
  return firstDefined(
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return firstDefined(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY
  );
}

export function getSupabaseServerKey(): string | undefined {
  return firstDefined(getSupabaseServiceRoleKey(), getSupabaseAnonKey());
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServerKey());
}

export function getDatabaseUrl(): string | undefined {
  return firstDefined(
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING
  );
}

function extractSupabaseProjectRef(): string | undefined {
  const supabaseUrl = getSupabaseUrl();

  if (!supabaseUrl) {
    return undefined;
  }

  try {
    const hostname = new URL(supabaseUrl).hostname;
    return hostname.split(".")[0] || undefined;
  } catch {
    return undefined;
  }
}

function toDirectSupabaseConnectionString(connectionString: string): string {
  const url = new URL(connectionString.replace(/^postgres:\/\//, "postgresql://"));
  const projectRef =
    extractSupabaseProjectRef() ||
    url.username.split(".")[1] ||
    undefined;

  if (!projectRef) {
    return connectionString;
  }

  const password = url.password;
  const directHost = `db.${projectRef}.supabase.co`;

  if (url.hostname === directHost && url.port === "5432") {
    return connectionString;
  }

  url.hostname = directHost;
  url.port = "5432";
  url.username = "postgres";

  if (password) {
    url.password = password;
  }

  return url.toString().replace(/^postgresql:\/\//, "postgres://");
}

export function getSchemaDatabaseUrl(): string | undefined {
  const connectionString = firstDefined(
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL
  );

  if (!connectionString) {
    return undefined;
  }

  return toDirectSupabaseConnectionString(connectionString);
}
