import { SubscriptionRow } from "@/types/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createSubscription(
  email: string,
  politicianName: string,
  politicianId?: string
): Promise<SubscriptionRow> {
  return createWatchSubscription({
    email,
    subscriptionType: "politician",
    politicianName,
    politicianId,
  });
}

export async function createTickerSubscription(
  email: string,
  ticker: string
): Promise<SubscriptionRow> {
  return createWatchSubscription({
    email,
    subscriptionType: "ticker",
    ticker: ticker.toUpperCase(),
  });
}

async function createWatchSubscription(input: {
  email: string;
  subscriptionType: "politician" | "ticker";
  politicianName?: string;
  politicianId?: string;
  ticker?: string;
}): Promise<SubscriptionRow> {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (input.subscriptionType === "politician") {
    const politicianName = input.politicianName?.trim();
    if (!politicianName) {
      throw new Error("politician_name is required");
    }

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
        politician_id: input.politicianId ?? null,
        subscription_type: "politician",
        ticker: null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data as SubscriptionRow;
  }

  const ticker = input.ticker?.trim().toUpperCase();
  if (!ticker) {
    throw new Error("ticker is required");
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("subscription_type", "ticker")
    .eq("ticker", ticker)
    .maybeSingle();

  if (existing) {
    return existing as SubscriptionRow;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      email: normalizedEmail,
      politician_name: `Ticker: ${ticker}`,
      politician_id: null,
      subscription_type: "ticker",
      ticker,
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

export async function getSubscribersForTicker(
  ticker: string
): Promise<SubscriptionRow[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("subscription_type", "ticker")
    .eq("ticker", ticker.toUpperCase());

  if (error) {
    throw new Error(`Failed to fetch ticker subscribers: ${error.message}`);
  }

  return (data ?? []) as SubscriptionRow[];
}
