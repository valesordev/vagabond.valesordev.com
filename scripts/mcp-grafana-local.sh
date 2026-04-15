#!/usr/bin/env bash
# mcp-grafana-local.sh
#
# Wrapper that sources .env to pick up GRAFANA_LOCAL_SA_TOKEN, then
# launches mcp-grafana pointed at the local Docker Compose Grafana instance.
#
# Used by .mcp.json (Claude Code) and .cursor/mcp.json (Cursor) for
# dashboard development against the local stack.
#
# Bootstrap: run `make grafana-sa-token` (needs the observability stack running).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$APP_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${GRAFANA_LOCAL_SA_TOKEN:-}" ]]; then
  echo "ERROR: GRAFANA_LOCAL_SA_TOKEN is not set in .env" >&2
  echo "Run: make grafana-sa-token  (requires the observability stack to be running)" >&2
  exit 1
fi

export GRAFANA_URL="${GRAFANA_ROOT_URL:-http://localhost:3003}"
export GRAFANA_SERVICE_ACCOUNT_TOKEN="$GRAFANA_LOCAL_SA_TOKEN"

exec /home/solo7/go/bin/mcp-grafana -t stdio
