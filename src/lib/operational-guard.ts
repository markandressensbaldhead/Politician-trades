import { NextResponse } from "next/server";

import { DEPRECATION, isSiteDeprecated } from "@/lib/site-status";

export function siteDeprecatedResponse() {
  return NextResponse.json(
    {
      deprecated: true,
      error: DEPRECATION.title,
      message: DEPRECATION.message,
    },
    { status: 410 }
  );
}

export function assertSiteOperational(): NextResponse | null {
  if (isSiteDeprecated()) {
    return siteDeprecatedResponse();
  }

  return null;
}
