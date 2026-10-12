#!/usr/bin/env bash
set -euo pipefail

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
}

SUPABASE_PUBLISHABLE_KEY="${SUPABASE_PUBLISHABLE_KEY:-${SUPABASE_ANON_KEY:-}}"
INTERNAL_FUNCTION_SECRET="${INTERNAL_FUNCTION_SECRET:-${ROUTINE_RUNNER_SECRET:-}}"

require_var "SUPABASE_URL"
require_var "SUPABASE_PUBLISHABLE_KEY"
require_var "INTERNAL_FUNCTION_SECRET"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for this script" >&2
  exit 1
fi

echo "[1/1] Trigger send-emails in dry-run mode (internal-secret protected)"
SEND_RESPONSE="$(curl -sS -X POST "${SUPABASE_URL}/functions/v1/send-emails" \
  -H "x-internal-function-secret: ${INTERNAL_FUNCTION_SECRET}" \
  -H "apikey: ${SUPABASE_PUBLISHABLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "dry_run": true
  }')"
echo "${SEND_RESPONSE}" | jq .

echo "Smoke test completed."
