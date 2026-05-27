# Trade the Hill

A dark-themed dashboard for tracking congressional stock trading activity from public financial disclosures.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **shadcn/ui** components
- **TypeScript**

## Getting Started

```bash
cd politician-trading-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with dark theme
│   ├── page.tsx                # Home / leaderboard
│   ├── search/page.tsx         # Search politicians
│   └── politician/[id]/page.tsx # Individual profiles
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── layout/                 # Header & footer
│   ├── dashboard/              # Stats cards, recent trades
│   ├── leaderboard/            # Leaderboard table
│   ├── politician/             # Profile components
│   └── search/                 # Search UI
├── lib/
│   ├── data.ts                 # Mock politician data
│   └── utils.ts                # Helpers & cn()
└── types/
    └── index.ts                # Shared TypeScript types
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Leaderboard ranked by YTD return, stats overview, recent trades |
| `/search` | Filter politicians by name, state, party, or committee |
| `/politician/[id]` | Individual profile with trade history |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `QUIVERQUANT_API_KEY` | QuiverQuant API bearer token |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (recommended for server writes) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude insights |
| `RESEND_API_KEY` | Resend API key for trade alert emails |
| `RESEND_FROM_EMAIL` | Verified sender address in Resend |
| `NEXT_PUBLIC_APP_URL` | Public app URL for profile links in emails |
| `CRON_SECRET` | Bearer token to protect `/api/sync-trades` |

Run `supabase/schema.sql` in your Supabase SQL editor to create the required tables.

## API Routes

### `GET /api/trades`

Fetches live congressional trade data from QuiverQuant and returns normalized JSON:

```json
{
  "trades": [
    {
      "politicianName": "Nancy Pelosi",
      "ticker": "NVDA",
      "tradeType": "buy",
      "amountRange": "$1,000,001 - $5,000,000",
      "tradeDate": "2024-07-26",
      "filingDate": "2024-07-30"
    }
  ],
  "count": 1
}
```

### `GET /api/insights/[politician]`

Generates or returns a cached weekly AI analysis for a politician:

1. Loads the last 100 trades from Supabase (syncs from QuiverQuant/mock if empty)
2. Sends formatted trade history to Claude (`claude-sonnet-4-6`)
3. Stores the result in Supabase with a timestamp
4. Returns cached analysis if generated within the last 7 days

```json
{
  "politicianId": "P000197",
  "politicianName": "Nancy Pelosi",
  "analysis": "Three paragraph analysis...",
  "generatedAt": "2026-05-26T12:00:00.000Z",
  "cached": true
}
```

### `POST /api/subscriptions`

Subscribe an email to trade alerts for a politician:

```json
{ "email": "you@example.com", "politician_name": "Nancy Pelosi" }
```

### `POST /api/sync-trades`

Polls QuiverQuant for new trades, inserts any missing rows into Supabase, and emails subscribers via Resend. Protect with `Authorization: Bearer CRON_SECRET`. Skips alert emails on the initial database bootstrap.

Schedule this endpoint every 15–60 minutes via Vercel Cron, GitHub Actions, or similar:

```bash
curl -X POST https://your-app.com/api/sync-trades \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Supabase Client

Import the Supabase client anywhere in server-side code:

```ts
import { getSupabaseClient } from "@/lib/supabase/client";

const supabase = getSupabaseClient();
```

## Next Steps

- Connect to a real congressional trading API (e.g. Quiver Quantitative)
- Add filtering/sorting controls on the leaderboard
- Add charts for portfolio performance over time
