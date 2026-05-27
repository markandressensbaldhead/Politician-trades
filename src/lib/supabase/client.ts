import { createClient, SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required"
    );
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

export function createSupabaseClient(): SupabaseClient {
  return getSupabaseClient();
}
