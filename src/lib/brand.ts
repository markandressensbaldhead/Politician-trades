/** Central brand config — update here when renaming or changing domain. */
export const BRAND = {
  name: "Hill Tape",
  slug: "hilltape",
  tagline: "See what Congress buys",
  domain: "hilltape.com",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://hilltape.com",
  contactEmail: "contact@hilltape.com",
  emailFrom: "Hill Tape <alerts@hilltape.com>",
  userAgent: "HillTape/1.0 (financial research dashboard)",
} as const;

export const SITE_URL = BRAND.url;
