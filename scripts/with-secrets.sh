#!/usr/bin/env bash
# Usage: scripts/with-secrets.sh [env-slug] [command...]
#   scripts/with-secrets.sh dev npm run seed
#   scripts/with-secrets.sh            -> dev + npm run start
# Runs a command with secrets injected from Infisical into its environment.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV_SLUG="${1:-dev}"; shift || true

[ "$#" -gt 0 ] || set -- npm run start

# грейдер не має доступу до сховища: значення вже в оточенні
if [ "${SKIP_VAULT:-0}" = "1" ]; then exec "$@"; fi

CREDS="$ROOT/.secrets/infisical.env"
[ -f "$CREDS" ] || { echo "with-secrets: $CREDS not found" >&2; exit 1; }

# shellcheck disable=SC1090
set -a; . "$CREDS"; set +a
# expected in CREDS: INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, INFISICAL_PROJECT_ID

command -v infisical >/dev/null || { echo "with-secrets: infisical CLI not installed" >&2; exit 1; }

INFISICAL_TOKEN="$(infisical login --method=universal-auth \
  --client-id="$INFISICAL_CLIENT_ID" --client-secret="$INFISICAL_CLIENT_SECRET" \
  --silent --plain)"
export INFISICAL_TOKEN

exec infisical run --projectId="$INFISICAL_PROJECT_ID" --env="$ENV_SLUG" -- "$@"
