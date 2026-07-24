# US-012: Single-command Compose deploy (core)

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Infra |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to bring up the core Vagabond stack with Docker Compose  
so that I can run the app locally without assembling services by hand.

## Acceptance criteria

1. Given a cloned repo and a filled `.env` from `.env.example`, when I run `docker compose up -d` (core / default profile), then Postgres/PostGIS, API, web, Martin/tiles path, and gateway become healthy enough to open the web UI and hit `/health`.
2. Given core is up, when I do **not** enable observability, then Grafana is not required for the app to function.
3. Given I want auth, when I start with `--profile auth`, then Keycloak is available at the documented path (complements US-011).
4. README quick start documents the correct compose commands and profile flags (no copy-paste that omits `--profile` when profiles are required).
5. Fresh boot seeds or documents the default dev user so FK `user_id` flows work for local development.

## ADR links

- [ADR-003](../../adr/ADR-003-grafana-optional-sidecar.md) — observability is optional sidecar
- [ADR-004](../../adr/ADR-004-auth-keycloak.md) — auth behind profile

## Out of scope

- Full operator runbooks for PMTiles acquisition, BYO OIDC, Pi edge (stubbed under `docs/runbooks/`)
- `--profile full` / storage / edge as v0.1 DoD requirements
- Production hardening checklist beyond local personal deploy

## Build notes

- Root `docker-compose.yml` and `.env.example`
- Fix README auth/full examples to pass the correct `--profile` flags as part of this story if still stale
- Gateway routes documented in README (web, api, tiles, auth)
