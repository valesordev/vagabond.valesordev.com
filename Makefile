COMPOSE := docker compose
OBS_PROFILE := --profile observability

.PHONY: up down up-observability down-observability ps logs restart-prometheus restart-observability

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

up-observability:
	$(COMPOSE) $(OBS_PROFILE) up -d

down-observability:
	$(COMPOSE) $(OBS_PROFILE) down

ps:
	$(COMPOSE) $(OBS_PROFILE) ps

logs:
	$(COMPOSE) $(OBS_PROFILE) logs -f --tail=200

restart-prometheus:
	$(COMPOSE) $(OBS_PROFILE) restart prometheus

restart-observability:
	$(COMPOSE) $(OBS_PROFILE) up -d --force-recreate prometheus grafana postgres-exporter cadvisor node-exporter
