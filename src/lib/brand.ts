/** Central brand config — update here when renaming or changing domain. */
export const BRAND = {
  name: "Trade the Hill",
  slug: "tradethehill",
  tagline: "See what Congress buys",
  domain: "tradethehill.com",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://tradethehill.com",
  contactEmail: "contact@tradethehill.com",
  emailFrom: "Trade the Hill <alerts@tradethehill.com>",
  userAgent: "TradeTheHill/1.0 (financial research dashboard)",
} as const;

export const SITE_URL = BRAND.url;
