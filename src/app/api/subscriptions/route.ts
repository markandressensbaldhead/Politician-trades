import { NextResponse } from "next/server";

import { createSubscription } from "@/lib/supabase/subscriptions";
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
    const politicianName = body.politician_name?.trim();
    const politicianId = body.politician_id?.trim();

    if (!email || !politicianName) {
      return NextResponse.json(
        { error: "Email and politician_name are required" },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
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
      politician_name: subscription.politician_name,
      created_at: subscription.created_at,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create subscription";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
