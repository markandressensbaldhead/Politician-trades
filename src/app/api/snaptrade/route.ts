import { NextResponse } from "next/server";

import {
  createSnapTradeUserId,
  getRobinhoodConnectionUrl,
  isSnapTradeConfigured,
  registerSnapTradeUser,
} from "@/lib/snaptrade-client";

function getRedirectUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/portfolio?snaptrade=connected`;
}

export async function GET() {
  return NextResponse.json({
    configured: isSnapTradeConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isSnapTradeConfigured()) {
    return NextResponse.json(
      {
        error:
          "SnapTrade is not configured. Add SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "register") {
      const existingUserId =
        typeof body.userId === "string" ? body.userId.trim() : "";
      const userId = existingUserId || createSnapTradeUserId();

      try {
        const credentials = await registerSnapTradeUser(userId);
        return NextResponse.json(credentials);
      } catch (error) {
        if (
          existingUserId &&
          typeof body.userSecret === "string" &&
          body.userSecret.trim()
        ) {
          return NextResponse.json({
            userId: existingUserId,
            userSecret: body.userSecret.trim(),
            reused: true,
          });
        }

        throw error;
      }
    }

    if (action === "connect") {
      const userId = body.userId?.trim();
      const userSecret = body.userSecret?.trim();

      if (!userId || !userSecret) {
        return NextResponse.json(
          { error: "userId and userSecret are required" },
          { status: 400 }
        );
      }

      const redirectURI = await getRobinhoodConnectionUrl(
        { userId, userSecret },
        getRedirectUrl()
      );

      return NextResponse.json({ redirectURI });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SnapTrade request failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
