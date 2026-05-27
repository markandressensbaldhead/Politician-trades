# Connect tradethehill.com (GoDaddy) → Vercel

Your app is already configured on Vercel. You only need **two DNS records** in GoDaddy.

## 1. Open DNS settings

1. Go to [godaddy.com](https://www.godaddy.com) and sign in
2. **My Products** → find **tradethehill.com** → **DNS** (or **Manage DNS**)

## 2. Remove parking records (if present)

Delete any existing records that might conflict:

- **A** records for `@` pointing to GoDaddy parking IPs
- **CNAME** for `www` pointing to `parked` or `@`

Keep the default **NS** (nameserver) records — do not change nameservers unless you move DNS elsewhere.

## 3. Add these records

| Type | Name | Value | TTL |
|------|------|--------|-----|
| **A** | `@` | `76.76.21.21` | 600 seconds (or 1 Hour) |
| **CNAME** | `www` | `cname.vercel-dns.com` | 600 seconds (or 1 Hour) |

**GoDaddy field tips:**

- **Name `@`** = root domain (`tradethehill.com`)
- **Name `www`** = `www.tradethehill.com` (GoDaddy may auto-append the domain)
- For CNAME, enter `cname.vercel-dns.com` only — no `https://`, no trailing path

## 4. Wait for propagation

Usually **5–30 minutes**, sometimes up to 48 hours.

Test:

- https://tradethehill.com
- https://www.tradethehill.com

Both should show **Trade the Hill** (your dashboard).

## 5. Optional: redirect www → apex in Vercel

1. [Vercel → politician-trades → Domains](https://vercel.com/markandressensbaldheads-projects/politician-trades/settings/domains)
2. Set **tradethehill.com** as primary
3. Redirect **www.tradethehill.com** → **tradethehill.com**

SSL (HTTPS) is automatic once DNS validates.

## Already done on Vercel

- `tradethehill.com` and `www.tradethehill.com` added to the project
- `NEXT_PUBLIC_APP_URL=https://tradethehill.com`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Still shows GoDaddy parking page | Delete old `@` A records; wait 30 min |
| `www` works but apex doesn’t | Confirm `@` A → `76.76.21.21` |
| SSL certificate pending | DNS must point to Vercel first; wait up to 24h |
| Wrong site / old deploy | Hard refresh or try incognito |

Until DNS propagates, use: **https://politician-trades.vercel.app**
