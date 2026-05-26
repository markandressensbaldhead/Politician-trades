import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required"
    );
  }

  return { url, key };
}

export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) {
    return serverClient;
  }

  const { url, key } = getSupabaseConfig();
  serverClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
