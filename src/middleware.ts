import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEPRECATION, isSiteDeprecated } from "@/lib/site-status";

const blockedApiPrefixes = [
  "/api/sync-trades",
  "/api/sync-sec-filings",
  "/api/portfolio-advice",
  "/api/setup",
];

const blockedApiPatterns = [
  /^\/api\/insights\//,
  /^\/api\/filing-insights\//,
  /^\/api\/alpha-brief\//,
];

export function middleware(request: NextRequest) {
  if (!isSiteDeprecated()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (request.method !== "GET" && pathname.startsWith("/api/")) {
    const blocked =
      blockedApiPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
      blockedApiPatterns.some((pattern) => pattern.test(pathname));

    if (blocked) {
      return NextResponse.json(
        {
          deprecated: true,
          error: DEPRECATION.title,
          message: DEPRECATION.message,
        },
        { status: 410 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
