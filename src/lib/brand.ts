/** Central brand config — update here when renaming or changing domain. */
export const BRAND = {
  name: "Trade the Hill",
  slug: "tradethehill",
  tagline: "See what the Hill is buying",
  shortTagline: "Congressional trades, decoded for retail",
  domain: "tradethehill.org",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://tradethehill.org",
  contactEmail: "contact@tradethehill.org",
  emailFrom: "Trade the Hill <alerts@tradethehill.org>",
  userAgent: "TradeTheHill/1.0 (financial research dashboard)",
  /** Shorthand for Congress / Capitol Hill in product copy */
  hill: "the Hill",
} as const;

export const COPY = {
  heroHeadline: "Trade the Hill.",
  heroSubhead: "See every disclosed buy before the crowd catches up.",
  heroBody:
    "Lawmakers must file every stock trade — but the data is buried in PDFs. We turn Hill disclosures into a retail-ready feed: who bought, how much, and whether it beat the S&P. Your edge is speed, not insider access.",
  heroCtaPrimary: "See today's Hill pick",
  heroCtaSecondary: "Browse all Hill trades",
  heroStatCongress: "The Hill vs S&P (90d avg)",
  heroRetailBlurb:
    "One page for today's Hill signal, one click to the ticker, one alert when lawmakers move again. Share the daily pick — that's the whole story.",
  footerHeadline: "The Hill has to disclose. You get to trade smarter.",
  footerSub:
    "Free for retail. Share today's Hill pick on X — that's how this spreads.",
  hillFlow: "Hill flow",
  hillSignal: "Hill signal",
  hillCluster: "Hill cluster",
  hillTrades: "Hill trades",
  hillPick: "Hill pick",
  vsYourBook: "The Hill vs your book",
  lawmakers: "lawmakers",
  disclosureDisclaimer:
    "STOCK Act public filings only. Research and education — not investment advice. Past Hill performance does not guarantee future results.",
  nextDisclosureSync:
    "We pull new STOCK Act filings every morning when House & Senate data updates.",
} as const;

export const SITE_URL = BRAND.url;
