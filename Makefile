COMPOSE     := docker compose
OBS_PROFILE := --profile observability
FULL_PROFILES := --profile auth --profile storage --profile observability --profile full

# Expose .env vars (GRAFANA_ADMIN_PASSWORD, GRAFANA_PORT, etc.) to make targets
-include .env
export

.PHONY: up down down-clean ps logs restart-prometheus restart-observability rebuild rebuild-server rebuild-web grafana-sa-token e2e-list e2e e2e-headed e2e-ui

up:
	$(COMPOSE) $(FULL_PROFILES) up -d --force-recreate

down:
	$(COMPOSE) $(FULL_PROFILES) down --remove-orphans

down-clean:
	$(COMPOSE) $(FULL_PROFILES) down --volumes --remove-orphans

ps:
	$(COMPOSE) $(FULL_PROFILES) ps

logs:
	$(COMPOSE) $(FULL_PROFILES) logs -f --tail=200

restart-prometheus:
	$(COMPOSE) $(OBS_PROFILE) restart prometheus

restart-observability:
	$(COMPOSE) $(OBS_PROFILE) up -d --force-recreate prometheus grafana postgres-exporter cadvisor node-exporter

# ── Rebuild targets ───────────────────────────────────────────────────────────
# Rebuild and restart the full app stack (server + web), leaving postgres and
# martin untouched.
rebuild:
	$(COMPOSE) build --no-cache vagabond-server vagabond-web
	$(COMPOSE) up -d --force-recreate vagabond-server vagabond-web

# Rebuild and restart only the Rust API server.
rebuild-server:
	$(COMPOSE) build --no-cache vagabond-server
	$(COMPOSE) up -d --force-recreate vagabond-server

# Rebuild and restart only the Next.js frontend.
rebuild-web:
	$(COMPOSE) build --no-cache vagabond-web
	$(COMPOSE) up -d --force-recreate vagabond-web

# ── MCP / tooling auth ────────────────────────────────────────────────────────
# Creates a Grafana service account + token and writes it to .env as
# GRAFANA_LOCAL_SA_TOKEN.  Requires the observability stack to be running.
# Usage: make up-observability && make grafana-sa-token
grafana-sa-token:
	@GRAFANA_BASE="http://localhost:$${GRAFANA_PORT:-3003}"; \
	GRAFANA_CREDS="$${GRAFANA_ADMIN_USER:-admin}:$${GRAFANA_ADMIN_PASSWORD:-changeme}"; \
	echo "Waiting for Grafana at $$GRAFANA_BASE ..."; \
	until curl -sf -u "$$GRAFANA_CREDS" "$$GRAFANA_BASE/api/health" > /dev/null; do sleep 2; done; \
	echo "Resolving service account 'vagabond-mcp' ..."; \
	SA_ID=$$(curl -sf -u "$$GRAFANA_CREDS" \
	  "$$GRAFANA_BASE/api/serviceaccounts/search?query=vagabond-mcp" \
	  | jq -r '.serviceAccounts[] | select(.name=="vagabond-mcp") | .id' 2>/dev/null); \
	if [ -z "$$SA_ID" ] || [ "$$SA_ID" = "null" ]; then \
	  echo "  → creating new service account ..."; \
	  SA_ID=$$(curl -sf -u "$$GRAFANA_CREDS" \
	    -X POST "$$GRAFANA_BASE/api/serviceaccounts" \
	    -H 'Content-Type: application/json' \
	    -d '{"name":"vagabond-mcp","role":"Admin"}' | jq -r '.id'); \
	else \
	  echo "  → found existing SA id=$$SA_ID"; \
	fi; \
	if [ -z "$$SA_ID" ] || [ "$$SA_ID" = "null" ]; then \
	  echo "ERROR: could not create or find service account"; exit 1; \
	fi; \
	echo "Generating token ..."; \
	TOKEN=$$(curl -sf -u "$$GRAFANA_CREDS" \
	  -X POST "$$GRAFANA_BASE/api/serviceaccounts/$$SA_ID/tokens" \
	  -H 'Content-Type: application/json' \
	  -d "{\"name\":\"vagabond-mcp-token-$$(date +%s)\"}" | jq -r '.key'); \
	if [ -z "$$TOKEN" ] || [ "$$TOKEN" = "null" ]; then \
	  echo "ERROR: token generation failed"; exit 1; \
	fi; \
	if grep -q '^GRAFANA_LOCAL_SA_TOKEN=' .env 2>/dev/null; then \
	  sed -i "s|^GRAFANA_LOCAL_SA_TOKEN=.*|GRAFANA_LOCAL_SA_TOKEN=$$TOKEN|" .env; \
	else \
	  echo "GRAFANA_LOCAL_SA_TOKEN=$$TOKEN" >> .env; \
	fi; \
	echo "Done — GRAFANA_LOCAL_SA_TOKEN written to .env"; \
	echo "Restart Claude Code / Cursor to pick up the new MCP credentials."

# ── Playwright e2e ────────────────────────────────────────────────────────────
# Always run Playwright from web/vagabond-web so the test runner and imported
# @playwright/test module resolve to the same package instance.
e2e-list:
	cd web/vagabond-web && npm run test:e2e -- --list

e2e:
	cd web/vagabond-web && npm run test:e2e

e2e-headed:
	cd web/vagabond-web && npm run test:e2e:headed

e2e-ui:
	cd web/vagabond-web && npm run test:e2e:ui
