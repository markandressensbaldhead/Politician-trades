# Trade the Hill — site retirement & billing shutdown

This project is **deprecated** as of May 2026. The codebase disables crons, paid API routes, and live data loading when deployed from `main`.

You must still **cancel subscriptions manually** in each provider’s billing settings. Removing env vars alone does not cancel a paid plan.

## 1. Stop automated spend (deploy first)

Push the deprecation commit, then redeploy on Vercel. That will:

- Remove cron jobs (no daily sync / API polling)
- Return `410 Gone` on sync and AI routes
- Show the sunset page instead of live dashboards

Optional — strip secrets from Vercel (stops accidental usage if crons are re-added):

```bash
export VERCEL_TOKEN=your_token
bash scripts/remove-vercel-env.sh
```

## 2. Cancel each service

| Service | Billing URL | What to do |
|---------|-------------|------------|
| **Vercel** | https://vercel.com/account | Delete project `politician-trades` or downgrade to free and remove domain |
| **Supabase** | https://supabase.com/dashboard | Project → Settings → General → **Pause project** or **Delete project** |
| **Unusual Whales** | https://unusualwhales.com/pricing | Cancel API subscription |
| **QuiverQuant** | https://api.quiverquant.com | Cancel API plan |
| **FMP** | https://site.financialmodelingprep.com/developer/docs/pricing | Cancel paid plan |
| **Anthropic** | https://console.anthropic.com/settings/billing | Remove payment method / delete API keys |
| **Resend** | https://resend.com/settings/billing | Cancel plan or delete account |
| **Domain (tradethehill.org)** | GoDaddy or Vercel Domains | Turn off **auto-renew** or transfer away |

Free sources (House Clerk, Capitol Trades public endpoints) have **no subscription** — nothing to cancel.

## 3. Domain & DNS

- **tradethehill.org** — disable auto-renew at registrar
- **politician-trades.vercel.app** — removed when Vercel project is deleted
- Legacy **capitoltrades.com** DNS scripts in `scripts/` — ignore unless you still pay for that domain

## 4. GitHub

Repo can stay public or be archived:

GitHub → Settings → **Archive this repository** (stops issues/PRs, preserves code).

## 5. Local secrets

Delete or rotate keys you no longer need:

- `.env.local`
- `secrets.env` (never committed)

## 6. Re-enable (not recommended)

Set `SITE_DEPRECATED=false` in Vercel env and restore `vercel.json` crons from git history.
