import { SubscriptionRow } from "@/types/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createSubscription(
  email: string,
  politicianName: string,
  politicianId?: string
): Promise<SubscriptionRow> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("politician_name", politicianName)
    .maybeSingle();

  if (existing) {
    return existing as SubscriptionRow;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      email: normalizedEmail,
      politician_name: politicianName,
      politician_id: politicianId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  return data as SubscriptionRow;
}

export async function getSubscribersForPolitician(
  politicianName: string
): Promise<SubscriptionRow[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .ilike("politician_name", politicianName);

  if (error) {
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }

  return (data ?? []) as SubscriptionRow[];
}
