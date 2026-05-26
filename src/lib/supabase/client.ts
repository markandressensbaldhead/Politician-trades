import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

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
