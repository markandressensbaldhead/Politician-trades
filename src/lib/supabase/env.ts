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

export function getSchemaDatabaseUrl(): string | undefined {
  return firstDefined(
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL
  );
}
