# AI Insights — 5 minute setup (you must click these; we can't log in for you)

## Fastest path: Vercel + Supabase integration (auto-fills 3 keys)

This is the easiest way. Supabase plugs into Vercel and sets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for you.

1. Open https://vercel.com/markandressensbaldheads-projects/politician-trades
2. Click **Storage** in the top nav (or **Integrations** → search **Supabase**)
3. Click **Create Database** or **Connect Supabase**
4. Sign into Supabase → select project **wqywvenxvbagawnwlebh**
5. Click **Connect** / **Continue**

Vercel will inject the three Supabase env vars automatically.

---

## Add Anthropic key (1 variable, manual)

1. Get a key: https://console.anthropic.com → **API Keys** → **Create Key**
2. Vercel → **Politician-trades** → **Settings** → **Environment Variables**
   - Direct link: https://vercel.com/markandressensbaldheads-projects/politician-trades/settings/environment-variables
3. **Add:**
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...`
   - Environments: Production, Preview, Development
4. **Save**

Also confirm these exist (you may have added them already):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_APP_URL` | `https://capitoltrades.com` |
| `QUIVERQUANT_API_KEY` | your QuiverQuant key |
| `CRON_SECRET` | any random string |

---

## Supabase tables (already done if you ran schema.sql)

In Supabase **Table Editor**, confirm you see:

- `congress_trades`
- `politician_insights`
- `subscriptions`

If not, SQL Editor → paste `supabase/schema.sql` → **Run**.

---

## Redeploy

Deployments → top **Ready** row → **⋯** → **Redeploy**

---

## Test

https://capitoltrades.com/politician/nancy-pelosi

Wait ~20 seconds on **AI Insights**.

---

## Optional: push all env vars from terminal

If you install Node/npm later:

```bash
cp secrets.env.example secrets.env
# fill in secrets.env
export VERCEL_TOKEN=...   # from vercel.com/account/tokens
bash scripts/push-vercel-env.sh
```

Then redeploy on Vercel.

---

## Custom domain: capitoltrades.com

Code defaults and share links use `https://capitoltrades.com`. To attach the domain on Vercel:

```bash
export VERCEL_TOKEN=...   # https://vercel.com/account/tokens
bash scripts/setup-capitoltrades-domain.sh
```

Or manually: Vercel → **Settings** → **Domains** → add `capitoltrades.com` and `www.capitoltrades.com`, set `NEXT_PUBLIC_APP_URL=https://capitoltrades.com`, then redeploy.

**DNS at your registrar:**

| Host | Type | Value |
|------|------|--------|
| `@` | A | `76.76.21.21` |
| `www` | CNAME | `cname.vercel-dns.com` |

Redirect `www` → apex in Vercel Domains. SSL is automatic once DNS validates.
