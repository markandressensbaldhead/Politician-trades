import { NextResponse } from "next/server";

import {
  createSubscription,
  createTickerSubscription,
} from "@/lib/supabase/subscriptions";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const email = body.email?.trim();
    const subscriptionType = body.subscription_type === "ticker"
      ? "ticker"
      : "politician";
    const politicianName = body.politician_name?.trim();
    const politicianId = body.politician_id?.trim();
    const ticker = body.ticker?.trim().toUpperCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (subscriptionType === "ticker") {
      if (!ticker) {
        return NextResponse.json(
          { error: "ticker is required for ticker subscriptions" },
          { status: 400 }
        );
      }

      const subscription = await createTickerSubscription(email, ticker);

      return NextResponse.json({
        id: subscription.id,
        email: subscription.email,
        subscription_type: "ticker",
        ticker: subscription.ticker,
        created_at: subscription.created_at,
      });
    }

    if (!politicianName) {
      return NextResponse.json(
        { error: "politician_name is required" },
        { status: 400 }
      );
    }

    const subscription = await createSubscription(
      email,
      politicianName,
      politicianId
    );

    return NextResponse.json({
      id: subscription.id,
      email: subscription.email,
      subscription_type: "politician",
      politician_name: subscription.politician_name,
      created_at: subscription.created_at,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create subscription";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
