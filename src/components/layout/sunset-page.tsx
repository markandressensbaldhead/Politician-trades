import Link from "next/link";

import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { BRAND, COPY } from "@/lib/brand";
import { DEPRECATION } from "@/lib/site-status";

const cancelledServices = [
  { name: "Vercel hosting", action: "Delete or pause the politician-trades project" },
  { name: "Supabase", action: "Pause or delete project wqywvenxvbagawnwlebh" },
  { name: "Unusual Whales API", action: "Cancel API subscription at unusualwhales.com" },
  { name: "QuiverQuant API", action: "Cancel at api.quiverquant.com" },
  { name: "Financial Modeling Prep", action: "Cancel at financialmodelingprep.com" },
  { name: "Anthropic (Claude)", action: "Remove API key / cancel billing at console.anthropic.com" },
  { name: "Resend (email alerts)", action: "Cancel at resend.com" },
  { name: "tradethehill.org domain", action: "Turn off auto-renew at your registrar (GoDaddy/Vercel)" },
];

export function SunsetPage() {
  return (
    <SiteContainer className="pb-20 pt-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4">
          <p className="page-eyebrow text-amber-400/90">Retired</p>
          <h1>{DEPRECATION.title}</h1>
          <p className="prose-muted">{DEPRECATION.message}</p>
          <p className="text-sm text-muted-foreground">
            {COPY.disclosureDisclaimer}
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-6">
          <h2 className="text-lg font-semibold">What was {BRAND.name}?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A free research dashboard that tracked STOCK Act congressional stock
            disclosures — leaderboard, ticker views, and disclosure timing — built
            for retail investors at {BRAND.domain}.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold">Cancel remaining subscriptions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Automated sync, crons, and paid API routes are disabled in this
            deployment. You still need to cancel billing in each provider&apos;s
            dashboard so charges stop.
          </p>
          <ul className="mt-4 space-y-3">
            {cancelledServices.map((service) => (
              <li
                key={service.name}
                className="border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.action}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Full checklist: see <code className="text-foreground">DEPRECATION.md</code>{" "}
            in the project repo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`mailto:${DEPRECATION.contact}`}>Contact</Link>
          </Button>
        </div>
      </div>
    </SiteContainer>
  );
}
