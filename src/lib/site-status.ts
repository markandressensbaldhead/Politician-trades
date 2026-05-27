/**
 * Site sunset — production stays deprecated unless SITE_DEPRECATED=false (local testing only).
 */
export function isSiteDeprecated(): boolean {
  return process.env.SITE_DEPRECATED !== "false";
}

export const DEPRECATION = {
  title: "Trade the Hill has been retired",
  message:
    "This project is no longer maintained. Live congressional data, alerts, and AI features have been turned off.",
  effectiveDate: "May 2026",
  contact: "contact@tradethehill.org",
} as const;
