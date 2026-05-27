#!/usr/bin/env bash
set -euo pipefail

# Removes paid/operational env vars from Vercel to prevent accidental API usage.
# Does NOT cancel vendor subscriptions — see DEPRECATION.md.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN."
  echo "Create one at https://vercel.com/account/tokens then run:"
  echo "  export VERCEL_TOKEN=your_token"
  echo "  bash scripts/remove-vercel-env.sh"
  exit 1
fi

PROJECT_ID="${VERCEL_PROJECT_ID:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Fetching project ID for politician-trades..."
  PROJECT_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v9/projects/politician-trades" | \
    node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.id||'')})")
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "Could not resolve Vercel project ID. Set VERCEL_PROJECT_ID manually."
  exit 1
fi

remove_env() {
  local key="$1"
  echo "Removing $key from Vercel..."
  curl -s -X DELETE \
    "https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${key}?target=production,preview,development" \
    -H "Authorization: Bearer $VERCEL_TOKEN" > /dev/null || true
}

KEYS=(
  UNUSUAL_WHALES_API_KEY
  QUIVERQUANT_API_KEY
  FMP_API_KEY
  ANTHROPIC_API_KEY
  RESEND_API_KEY
  RESEND_FROM_EMAIL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_URL
  SUPABASE_ANON_KEY
  DATABASE_URL
  CRON_SECRET
)

for key in "${KEYS[@]}"; do
  remove_env "$key"
done

echo ""
echo "Done. Env vars removed from Vercel project ${PROJECT_ID}."
echo "You still must cancel subscriptions in each vendor billing portal (see DEPRECATION.md)."
