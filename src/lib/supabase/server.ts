import { createClient, SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseServerKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

let serverClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = getSupabaseUrl();
  const key = getSupabaseServerKey();

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

export function createSupabaseClient(): SupabaseClient {
  return getSupabaseServerClient();
}

export { isSupabaseConfigured };
