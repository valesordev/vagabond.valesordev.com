# CLAUDE.md — Vagabond Project Working Memory

This file is the persistent context for app development sessions on the Vagabond project.

> **Note**: Planning docs, trip logs, buildout files, rig profile, and camping region references
> have moved to `life.solo7.media/vagabond/`. This repo now contains only the application source code.

---

## Who I Am

- **Brian Ashburn** — based in University Heights, San Diego
- 25-year CS background; no hand-holding needed on Rust, PostGIS, Docker, systems design
- Primary trip regions: Mojave National Preserve (~3.5hr), Eastern Sierra (~5.5hr)
- Solo desert overlander + remote worker; cat travels on all trips
- Rig: 5th gen Toyota 4Runner (23gal tank, ~400mi range, stock clearance)

---

## What Vagabond Is

**Vagabond** is an open-source (MIT), self-hosted, offline-first trip planning and live
tracking platform for overlanders and nomadic travelers. Docker Compose is the primary
deployment target. No cloud lock-in. No proprietary map providers.

**Core constraints (non-negotiable):**
1. Offline-first — every feature degrades gracefully without connectivity
2. Self-hosted — Docker Compose single-command deploy
3. Spatial-native — all geo logic through PostGIS, never app-layer math
4. Open standards throughout — GPX, GeoJSON, OSM, PMTiles, MapLibre, NMEA 0183

---

## Current Codebase State (as of 2026-03-20)

### What exists and is scaffolded:

**Rust workspace** — workspace `Cargo.toml` with 4 crates:
- `crates/vagabond-core` — domain types (`trip.rs`, `rig.rs`, `geo.rs`, `error.rs`); zero infra deps
- `crates/vagabond-server` — Axum server with `/health` + `/api/v1` router; migrations wired up; config, state, error modules
- `crates/vagabond-gear` — gear inventory domain; `lib.rs` + `repository.rs`
- `crates/vagabond-telemetry` — telemetry ingest; `ingest.rs`, `model.rs`

**Database migrations** (in `crates/vagabond-server/migrations/`):
- `0001_bootstrap.sql` — PostGIS extension, uuid setup
- `0002_core_schema.sql` — trips, waypoints, rigs, gear tables
- `0003_telemetry.sql` — telemetry sessions + points

**Next.js frontend** (`web/vagabond-web/`) — scaffolded with App Router, MapLibre,
shadcn/ui, Tailwind, Zustand, React Query. Basic `page.tsx` and `layout.tsx` exist.

**Infrastructure:**
- `docker-compose.yml` — all services with compose profiles
- `agent/alloy-config/config.alloy` — Raspberry Pi Alloy agent config
- `infra/grafana/`, `infra/keycloak/`, `infra/prometheus/` — provisioning configs
- All 5 ADRs written and committed (`docs/adr/`)

**What's NOT yet implemented (MVP backlog):**
- Keycloak auth integration in server middleware
- Trip CRUD API handlers (routes stubbed, logic pending)
- GPX import → PostGIS pipeline
- MapLibre map view with PMTiles base in frontend
- Packing list generator (gear → trip manifest)
- Frontend pages beyond the landing scaffold

---

## Tech Stack Quick Reference

| Layer | Tech |
|-------|------|
| Backend | Rust / Axum / SQLx |
| Database | PostgreSQL 16 + PostGIS 3.x |
| Tile server | Martin (MVT over PostGIS) |
| Frontend | Next.js 14 App Router / TypeScript |
| Map engine | MapLibre GL JS + PMTiles |
| State (client) | Zustand (map) + React Query (server data) |
| UI | shadcn/ui + Tailwind |
| Auth | Keycloak (OIDC) |
| Object storage | MinIO (S3-compatible) |
| Telemetry agent | Grafana Alloy on Raspberry Pi (OTLP ingest) |
| Observability | Grafana Cloud (optional `--profile observability`) |
| Deployment | Docker Compose |

**Compose profiles:** `default` (core) · `--profile auth` · `--profile storage` · `--profile observability` · `--profile full`

---

## Repo Conventions (fast reference)

**Branches:** `main` (stable) → `dev` (integration) → `feat/*` / `fix/*` / `chore/*`

**Commits:** Conventional Commits — `feat(gear): add weight tracking to GearItem`

**PRs:** Squash → `dev`; merge commit → `main`. CI must pass (`cargo clippy -D warnings`, `cargo fmt`, `jest`).

**ADRs:** Required before any change to domain model, API shape, or infrastructure.
File at `docs/adr/ADR-NNN-short-title.md`. Template at `docs/adr/ADR-000-template.md`.

**Migrations:** `sqlx migrate`, versioned `NNNN_description.sql`. Never edit committed migrations.

**Rust rules:** No `unwrap()` in lib code. `thiserror` for libs, `anyhow` OK in binaries. Tokio throughout.

**API envelope:**
```json
{ "data": {...}, "meta": {"total": N, "page": 1}, "error": null }
```

**Error format:**
```json
{ "data": null, "error": {"code": "TRIP_NOT_FOUND", "message": "...", "status": 404} }
```

---

## Rig Quick Reference

| Item | Detail |
|------|--------|
| Vehicle | Toyota 4Runner 5th Gen |
| Fuel range | ~400mi (23gal tank) — plan fuel stops every 200mi remote |
| Sleep | Foam mat on cargo floor (functional now); platform build is backlog |
| Power total | 3,162 Wh (Jackery 1000 + 2000) |
| Solar | 400W peak (2× Jackery SolarSaga 200W) → ~1,800 Wh/day desert (300W avg × 6hr peak) |
| Fridge | BougeRV 23qt 12V compressor cooler (~40W draw) |
| Connectivity | Starlink portable (~50–75W active); Raspberry Pi Alloy agent |
| Navigation | OsmAnd (primary, FOSS, offline OSM, GPX-native) |
| Travel companion | Cat (cab zone supplies) |

**Build backlog (prioritized):** satellite communicator → roof rack → recovery kit → water filtration → skid plates → paper topo maps → sleeping platform

---

## Trip Planning Quick Reference

**Primary regions:**
- **Mojave National Preserve** — Oct–Apr optimal; no permit; carry 7gal water min; Starlink essential
- **Eastern Sierra** — Jun–Oct (passes open); Inyo NF permits for some wilderness zones; water available (filter)
- **Alabama Hills** — BLM, free dispersed, no permit, 14-day limit; high-priority target

**Planning workflow:**
1. Seasonal viability + road conditions + permit check
2. Route design → GPX waypoints, fuel stops, water sources, bail-out routes
3. Campsite targeting (dispersed BLM/USFS preferred)
4. Logistics matrix (driving days, mileage, elevation, weather)
5. Trip-specific gear manifest from rig inventory

**Key sources:** iOverlander, Caltopo, BLM Recreation Map, Recreation.gov, USFS Road Conditions, NOAA

---

## Session Startup Checklist

For **app development sessions:**
- [ ] Invoke `vagabond-assistant` skill
- [ ] Load `references/app-architecture.md` and `references/project-standards.md`
- [ ] Review open MVP backlog items above
- [ ] Write ADR before implementing any architectural decision

---

## Key File Locations

```
vagabond.solo7.media/
├── CLAUDE.md                          ← this file
├── Cargo.toml                         ← workspace root
├── docker-compose.yml
├── crates/
│   ├── vagabond-core/                 ← domain types, zero infra deps
│   ├── vagabond-server/               ← Axum HTTP API + migrations
│   ├── vagabond-gear/                 ← gear inventory domain
│   └── vagabond-telemetry/            ← OTLP ingest (v0.2)
├── web/vagabond-web/                  ← Next.js frontend
├── agent/alloy-config/                ← Raspberry Pi Alloy config
├── docs/adr/                          ← Architecture Decision Records
└── infra/                             ← Grafana, Keycloak, Prometheus configs
```

**Trip planning docs, buildout files, rig profile, and camping region references** →
`life.solo7.media/vagabond/`
