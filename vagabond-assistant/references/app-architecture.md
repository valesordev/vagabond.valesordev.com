# Vagabond — App Architecture

## Vision

Vagabond is a self-hosted, offline-first trip planning and live tracking platform for
overlanders, vanlifers, backpackers, and nomadic travelers. It is open source (MIT),
Docker Compose deployable, and designed to work without internet connectivity in the field.

---

## Core Principles

1. **Offline-first** — every feature must work (or gracefully degrade) without connectivity
2. **Self-hosted** — Docker Compose is the primary deployment target; no cloud lock-in
3. **Hybrid data ownership** — Vagabond owns its own data layer; Grafana/Alloy is optional
4. **Spatial-native** — all geo operations go through PostGIS; no app-layer geo math
5. **Open** — MIT license; community route/campsite contributions built in from day one

---

## Tech Stack

### Backend — `vagabond-server` (Rust)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| HTTP framework | Axum | Async, ergonomic, tower ecosystem |
| ORM / query builder | SQLx | Compile-time checked queries, async |
| Database | PostgreSQL 16 + PostGIS 3.x | Spatial-native, proven, self-hostable |
| Tile server | Martin | Rust-native MVT tile server over PostGIS |
| Auth | Keycloak (sidecar) | Aligns with Valesor stack; OIDC/OAuth2 |
| File storage | Local FS / MinIO (S3-compatible) | GPX imports, offline tile packages |
| Background jobs | Tokio tasks initially; consider Faktory later | Telemetry ingestion, tile generation |

### Frontend — `vagabond-web` (Next.js / TypeScript)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router) | SSR for trip data, CSR for map interactions |
| Map engine | MapLibre GL JS | OSS, offline-capable, WebGL |
| Offline tiles | PMTiles (OSM base) | Single-file tile archive, browser-streamable |
| State management | Zustand (client map state) + React Query (server data) | Separation of concerns |
| UI | shadcn/ui + Tailwind | Consistent with Valesor aesthetic |

### Telemetry Agent — `vagabond-agent` (Raspberry Pi)

| Component | Choice |
|-----------|--------|
| Agent runtime | Grafana Alloy |
| Ingest protocol | OTLP → vagabond-server `/ingest` endpoint |
| Offline buffering | Alloy WAL (write-ahead log) |
| GPS source | USB GPS puck or phone NMEA over BT |
| Data: position, speed, altitude, heading, power stats (Victron/Jackery), temp |

### Infrastructure (Docker Compose)

```
vagabond/
├── docker-compose.yml
├── docker-compose.override.yml       (local dev overrides)
├── services/
│   ├── vagabond-server/              (Rust API)
│   ├── vagabond-web/                 (Next.js)
│   ├── postgres/                     (PostGIS)
│   ├── martin/                       (tile server)
│   ├── keycloak/                     (auth)
│   ├── minio/                        (object storage)
│   └── grafana/                      (optional observability sidecar)
```

---

## Domain Model (Core Entities)

```
User
  └── Rig (vehicle profile — specs, gear, power system)
       └── GearItem (inventory items, categories, weight, storage zone)

Trip
  ├── TripLeg (ordered segments of a trip)
  │    ├── Waypoint (geo point + metadata)
  │    └── Route (LineString geometry, source: GPX import or drawn)
  ├── Campsite (Point geometry, type: dispersed/established/stealth)
  ├── PackingList (trip-specific gear manifest from Rig inventory)
  └── TelemetrySession
       └── TelemetryPoint (timestamped position + sensor readings)
```

All geometry stored as PostGIS types. Queries use `ST_` functions — no application-layer geo.

---

## Key Architectural Decisions (ADRs)

### ADR-001: Offline-First via PMTiles
Map tiles are served from a local PMTiles archive bundled with the Docker Compose stack.
Online tile sources (MapTiler, Mapbox) are optional enrichment only.

### ADR-002: Telemetry Decoupled from Trip Planning
Trip planning (routes, campsites, gear) is a standalone domain. Telemetry (live tracking)
is a separate ingest path that *annotates* trips post-hoc. This prevents the telemetry
pipeline from blocking planning features.

### ADR-003: Grafana as Optional Observability Sidecar
Grafana + Alloy is NOT required to run Vagabond. The docker-compose.yml has a
`--profile observability` flag that enables Grafana services. This keeps the core
stack lean for users who don't need it.

### ADR-004: Auth via Keycloak
Reuses Brian's Keycloak pattern from Valesor. Single OIDC provider for both projects
in personal infra. Community deployments can substitute any OIDC-compatible provider.

### ADR-005: Open Geo Standards Throughout
Brian has a hard preference for fully open standards. The geo stack reflects this:
- **GPX** (TopoGrafix open XML) — primary import/export for tracks, routes, waypoints
- **GeoJSON** (RFC 7946) — API wire format for all geo data
- **OSM** (ODbL) — map data source; no proprietary tile providers required
- **PMTiles** (Protomaps open spec) — single-file offline tile archive
- **MapLibre GL JS** (BSD-2) — map renderer; no Mapbox dependency
- **MVT / PBF** (open spec) — vector tile format served by Martin
- **NMEA 0183** — GPS sentence standard for agent hardware input
- **OsmAnd** — recommended field navigation app (FOSS, OSM-based, GPX-native)

KML import (v2) is a concession to format ubiquity, not a preference.
Gaia GPS and other proprietary tools are explicitly out of scope.

---

## Feature Milestones

### MVP (v0.1)
- [ ] User auth (Keycloak)
- [ ] Rig profile CRUD (vehicle specs + gear inventory)
- [ ] Trip CRUD with waypoints
- [ ] GPX route import → PostGIS
- [ ] MapLibre map view with PMTiles base
- [ ] Packing list generator from rig inventory
- [ ] Docker Compose single-command deploy

### v0.2 — Telemetry
- [ ] Alloy agent config for Raspberry Pi
- [ ] OTLP ingest endpoint on vagabond-server
- [ ] Live position display on map
- [ ] Trip telemetry replay

### v0.3 — Community
- [ ] Public campsite database (importable from iOverlander GPX)
- [ ] Route sharing (public/private toggle)
- [ ] Campsite comments + conditions reports

---

## Repo Structure

```
vagabond/
├── README.md
├── LICENSE (MIT)
├── CONTRIBUTING.md
├── docker-compose.yml
├── docs/
│   └── adr/                          (Architecture Decision Records)
├── crates/
│   ├── vagabond-core/                (domain types, shared logic)
│   ├── vagabond-server/              (Axum HTTP server)
│   ├── vagabond-gear/                (gear inventory domain)
│   └── vagabond-telemetry/           (telemetry ingest domain)
├── web/
│   └── vagabond-web/                 (Next.js frontend)
└── agent/
    └── alloy-config/                 (Grafana Alloy agent configs)
```
