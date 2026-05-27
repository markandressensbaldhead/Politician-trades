#!/usr/bin/env bash
# Attach custom domain to the Vercel project and set NEXT_PUBLIC_APP_URL.
#
# Usage:
#   export VERCEL_TOKEN=...   # https://vercel.com/account/tokens
#   APP_DOMAIN=hilltape.com bash scripts/setup-capitoltrades-domain.sh
#
# After running, configure DNS at your registrar using the records Vercel prints.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-politician-trades}"
DOMAIN="${APP_DOMAIN:-hilltape.com}"
WWW_DOMAIN="www.${DOMAIN}"
APP_URL="https://${DOMAIN}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN."
  echo "Create one at https://vercel.com/account/tokens then run:"
  echo "  export VERCEL_TOKEN=your_token"
  echo "  bash scripts/setup-capitoltrades-domain.sh"
  exit 1
fi

NODE="${NODE:-node}"
if ! command -v "$NODE" >/dev/null 2>&1; then
  NODE="/Volumes/Cursor Installer/Cursor.app/Contents/Resources/app/resources/helpers/node"
fi

TEAM_QUERY=""
if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
  TEAM_QUERY="?teamId=${VERCEL_TEAM_ID}"
fi

echo "Resolving Vercel project: ${PROJECT_NAME}..."
PROJECT_JSON=$(curl -s -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  "https://api.vercel.com/v9/projects/${PROJECT_NAME}${TEAM_QUERY}")

PROJECT_ID=$(echo "$PROJECT_JSON" | "$NODE" -e \
  "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.id||'')})")

if [[ -z "$PROJECT_ID" ]]; then
  echo "Could not resolve project ID. Response:"
  echo "$PROJECT_JSON"
  exit 1
fi

echo "Project ID: ${PROJECT_ID}"

add_domain() {
  local name="$1"
  echo "Adding domain ${name}..."
  local response
  response=$(curl -s -X POST \
    "https://api.vercel.com/v10/projects/${PROJECT_ID}/domains${TEAM_QUERY}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${name}\"}")

  echo "$response" | "$NODE" -e "
    let d='';
    process.stdin.on('data', c => d += c);
    process.stdin.on('end', () => {
      const j = JSON.parse(d);
      if (j.error) {
        console.error('  Error:', j.error.message || JSON.stringify(j.error));
        process.exit(j.error.code === 'domain_already_in_use' ? 0 : 1);
      }
      console.log('  OK —', j.name, j.verified ? '(verified)' : '(pending DNS)');
      if (j.verification) {
        for (const v of j.verification) {
          console.log('  Verify:', v.type, v.domain, '→', v.value);
        }
      }
    });
  " || true
}

set_env() {
  local key="$1"
  local value="$2"
  echo "Setting ${key}=${value}..."
  curl -s -X POST \
    "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true${TEAM_QUERY}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"${key}\",\"value\":\"${value}\",\"type\":\"plain\",\"target\":[\"production\",\"preview\",\"development\"]}" > /dev/null
  echo "  OK"
}

add_domain "$DOMAIN"
add_domain "$WWW_DOMAIN"
set_env "NEXT_PUBLIC_APP_URL" "$APP_URL"

echo ""
echo "Triggering production redeploy..."
DEPLOY_RESPONSE=$(curl -s -X POST \
  "https://api.vercel.com/v13/deployments${TEAM_QUERY}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$( "$NODE" -e "
    console.log(JSON.stringify({
      name: process.argv[1],
      target: 'production',
      gitSource: { type: 'github', ref: 'main', repoId: undefined }
    }))
  " "$PROJECT_NAME")")

echo "$DEPLOY_RESPONSE" | "$NODE" -e "
  let d='';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try {
      const j = JSON.parse(d);
      if (j.url) console.log('  Deploy started:', 'https://' + j.url);
      else if (j.error) console.log('  Redeploy skipped (trigger manually):', j.error.message || JSON.stringify(j.error));
    } catch { console.log('  Redeploy response:', d.slice(0, 200)); }
  });
" || true

echo ""
echo "=== DNS records (at your domain registrar) ==="
echo ""
echo "  ${DOMAIN} (apex):"
echo "    Type: A"
echo "    Name: @"
echo "    Value: 76.76.21.21"
echo ""
echo "  ${WWW_DOMAIN}:"
echo "    Type: CNAME"
echo "    Name: www"
echo "    Value: cname.vercel-dns.com"
echo ""
echo "In Vercel → Domains, set ${DOMAIN} as primary and redirect ${WWW_DOMAIN} → ${DOMAIN}."
echo ""
echo "Redeploy:"
echo "  https://vercel.com/markandressensbaldheads-projects/${PROJECT_NAME}/deployments"
echo ""
echo "Test when DNS propagates:"
echo "  ${APP_URL}"
