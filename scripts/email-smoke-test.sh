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
require_var "TEST_USER_EMAIL"
require_var "TEST_USER_PASSWORD"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for this script" >&2
  exit 1
fi

echo "[1/3] Sign in test user to get JWT"
AUTH_RESPONSE="$(curl -sS -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_PUBLISHABLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_USER_EMAIL}\",
    \"password\": \"${TEST_USER_PASSWORD}\"
  }")"

ACCESS_TOKEN="$(echo "${AUTH_RESPONSE}" | jq -r '.access_token // empty')"
if [[ -z "${ACCESS_TOKEN}" ]]; then
  echo "Unable to sign in test user. Response:" >&2
  echo "${AUTH_RESPONSE}" >&2
  exit 1
fi

echo "[2/3] Enqueue notification"
ENQUEUE_RESPONSE="$(curl -sS -X POST "${SUPABASE_URL}/functions/v1/enqueue-notification" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_PUBLISHABLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"Tickist smoke test\",
    \"text\": \"Smoke test at $(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"type\": \"notification\"
  }")"
echo "${ENQUEUE_RESPONSE}" | jq .

echo "[3/3] Trigger send-emails in dry-run mode (internal-secret protected)"
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
