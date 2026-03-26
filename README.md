# Vagabond

A self-hosted, offline-first trip planning and live tracking platform for overlanders,
vanlifers, and nomadic travelers. MIT licensed. Docker Compose deployable. No cloud
lock-in. No proprietary map providers.

> **Status:** Pre-MVP — core scaffolding is in place; features are actively being built.

---

## Core Principles

1. **Offline-first** — every feature works (or degrades gracefully) without connectivity
2. **Self-hosted** — single `docker compose up`; you own your data
3. **Spatial-native** — all geo logic runs through PostGIS; no app-layer coordinate math
4. **Open standards** — GPX, GeoJSON, OSM, PMTiles, MapLibre, NMEA 0183 throughout

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Backend | Rust / Axum / SQLx |
| Database | PostgreSQL 16 + PostGIS 3.x |
| Tile server | Martin (MVT over PostGIS) |
| Frontend | Next.js 15 App Router / TypeScript |
| Map engine | MapLibre GL JS + PMTiles |
| State | Zustand (map) + React Query (server data) |
| UI | shadcn/ui + Tailwind |
| Auth | Keycloak (OIDC) |
| Object storage | MinIO (S3-compatible) |
| Telemetry agent | Grafana Alloy on Raspberry Pi (OTLP ingest) |
| Observability | Grafana (optional) |
| Deployment | Docker Compose |

---

## Quick Start

```bash
# Core stack (server, web, postgres, martin)
docker compose up

# With auth
docker compose --profile auth up

# With object storage
docker compose --profile storage up

# With observability (Grafana, Prometheus)
docker compose --profile observability up

# Everything
docker compose --profile full up
```

Copy `.env.example` to `.env` and configure before first run.

---

## Repo Structure

```
vagabond.solo7.media/
├── vagabond/                  # App source code
│   ├── Cargo.toml             # Rust workspace root
│   ├── docker-compose.yml
│   ├── crates/
│   │   ├── vagabond-core/     # Domain types (no infra deps)
│   │   ├── vagabond-server/   # Axum HTTP server + migrations
│   │   ├── vagabond-gear/     # Gear inventory domain
│   │   └── vagabond-telemetry/ # Telemetry ingest
│   ├── web/vagabond-web/      # Next.js frontend
│   ├── agent/alloy-config/    # Raspberry Pi Alloy agent config
│   ├── docs/adr/              # Architecture Decision Records
│   └── infra/                 # Grafana, Keycloak, Prometheus configs
├── trips/                     # Trip planning documents and maps
├── buildout/                  # Vehicle build BOM and diagrams
└── images/                    # Trip photos
```

---

## Contributing

See [`vagabond/CONTRIBUTING.md`](vagabond/CONTRIBUTING.md).

Short version: open an issue before large PRs, follow Conventional Commits, write an ADR
for any decision affecting the domain model or infrastructure, and keep all geo logic in
PostGIS.

---

## License

MIT — see [`LICENSE`](LICENSE).
