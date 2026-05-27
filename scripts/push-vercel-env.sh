#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_FILE="${1:-$ROOT/secrets.env}"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Missing secrets.env"
  echo "Run: cp secrets.env.example secrets.env"
  echo "Then fill in your keys and run this script again."
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN."
  echo "Create one at https://vercel.com/account/tokens then run:"
  echo "  export VERCEL_TOKEN=your_token"
  echo "  bash scripts/push-vercel-env.sh"
  exit 1
fi

PROJECT_ID="${VERCEL_PROJECT_ID:-}"
TEAM_ID="${VERCEL_TEAM_ID:-}"

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

set -a
source "$SECRETS_FILE"
set +a

add_env() {
  local key="$1"
  local value="$2"

  if [[ -z "$value" ]]; then
    echo "Skipping empty $key"
    return
  fi

  echo "Setting $key..."
  curl -s -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(node -e "
      console.log(JSON.stringify({
        key: process.argv[1],
        value: process.argv[2],
        type: 'encrypted',
        target: ['production', 'preview', 'development']
      }))
    " "$key" "$value")" > /dev/null
}

add_env SUPABASE_URL "${SUPABASE_URL:-}"
add_env SUPABASE_ANON_KEY "${SUPABASE_ANON_KEY:-}"
add_env SUPABASE_SERVICE_ROLE_KEY "${SUPABASE_SERVICE_ROLE_KEY:-}"
add_env ANTHROPIC_API_KEY "${ANTHROPIC_API_KEY:-}"
add_env QUIVERQUANT_API_KEY "${QUIVERQUANT_API_KEY:-}"
add_env RESEND_API_KEY "${RESEND_API_KEY:-}"
add_env RESEND_FROM_EMAIL "${RESEND_FROM_EMAIL:-}"
add_env NEXT_PUBLIC_APP_URL "${NEXT_PUBLIC_APP_URL:-}"
add_env CRON_SECRET "${CRON_SECRET:-}"

echo ""
echo "Done. Redeploy at:"
echo "https://vercel.com/markandressensbaldheads-projects/politician-trades/deployments"
