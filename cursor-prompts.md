# Vagabond — Cursor Prompt Library

Copy-paste prompts for launching and continuing development in Cursor.
Organized by session type and MVP milestone.

---

## Session Startup

### Standard Session Open
```
Load project context from CLAUDE.md at the workspace root and from
.cursor/rules/vagabond-project-standards.mdc. Review the current MVP backlog
in CLAUDE.md and confirm what is scaffolded vs not yet implemented. Tell me
where we left off and what the logical next task is. Do not start writing code yet.
```

### Resume a Specific Feature
```
Load CLAUDE.md and .cursor/rules/vagabond-project-standards.mdc. I am continuing
work on [FEATURE NAME]. Read the relevant source files and summarize the current
state — what exists, what is stubbed, and what is missing. Then propose the next
concrete implementation step.
```

---

## MVP Feature Prompts

### 1. Trip CRUD API Handlers

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- crates/vagabond-core/src/trip.rs
- crates/vagabond-server/src/routes/v1/trips.rs
- crates/vagabond-server/src/state.rs
- crates/vagabond-server/migrations/0002_core_schema.sql

The trip routes are stubbed but have no logic. Implement full CRUD handlers for
trips (GET list, GET by id, POST create, PUT update, DELETE). Use SQLx for all
DB access. Follow the API response envelope: { data, meta, error }. Use the error
types already established in crates/vagabond-server/src/error.rs. No unwrap() in
any library code. Write unit tests for domain logic and integration tests for the
API endpoints.
```

### 2. Gear CRUD API Handlers

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- crates/vagabond-core/src/rig.rs
- crates/vagabond-gear/src/lib.rs
- crates/vagabond-gear/src/repository.rs
- crates/vagabond-server/src/routes/v1/gear.rs
- crates/vagabond-server/migrations/0002_core_schema.sql

Implement the gear route handlers wiring into the vagabond-gear repository. Follow
the same response envelope and error conventions as the rest of the server. Include
filtering by category and storage zone as query params on the list endpoint. Write
tests for repository logic and API handlers.
```

### 3. GPX Import → PostGIS Pipeline

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- crates/vagabond-core/src/trip.rs
- crates/vagabond-core/src/geo.rs
- crates/vagabond-server/migrations/0002_core_schema.sql
- docs/adr/ADR-005-open-geo-standards.md

Before implementing anything, write a draft ADR at docs/adr/ADR-006-gpx-import.md
covering: GPX parsing library choice, how tracks/routes/waypoints map to our Trip
domain model, how geometry gets stored in PostGIS (WGS84, GIST indexes), and what
happens with malformed or partial GPX files. Present the ADR for review before
writing any implementation code.
```

### 4. Keycloak Auth Middleware

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- crates/vagabond-server/src/main.rs
- crates/vagabond-server/src/state.rs
- crates/vagabond-server/src/error.rs
- infra/keycloak/realm-export.json
- docs/adr/ADR-004-auth-keycloak.md
- .env.example

Implement Axum middleware that validates OIDC JWTs issued by Keycloak. The middleware
should: fetch and cache JWKS from the Keycloak realm, validate iss/aud/exp claims,
extract the user subject into a request extension for downstream handlers. Auth should
be opt-in per router group — the /health endpoint must remain unauthenticated. Use
tower middleware layers. Write an ADR addendum if any implementation detail deviates
from ADR-004.
```

### 5. MapLibre Map View with PMTiles

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- web/vagabond-web/src/app/page.tsx
- web/vagabond-web/src/app/layout.tsx
- web/vagabond-web/package.json
- docs/adr/ADR-001-offline-first-pmtiles.md

Implement a full-screen MapLibre GL JS map component in the Next.js frontend that:
loads a PMTiles base map from a local URL (configurable via env var, falling back
to a bundled PMTiles file), uses Zustand for map viewport state (center, zoom,
bearing), renders as a client component ('use client'), and degrades gracefully if
the tiles URL is unreachable (shows a blank map with coordinates, no crash). Do not
use any Mapbox or MapTiler APIs — OSM/PMTiles only per ADR-001. Place the component
at web/vagabond-web/src/components/Map.tsx.
```

### 6. Packing List Generator

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- crates/vagabond-core/src/trip.rs
- crates/vagabond-core/src/rig.rs
- crates/vagabond-gear/src/lib.rs
- crates/vagabond-gear/src/repository.rs
- crates/vagabond-server/src/routes/v1/trips.rs

Before implementing, write ADR-007 covering how a packing list is modeled: is it a
snapshot of gear items at trip creation time, or a live view? How does it handle
items added to the rig inventory after the trip was created? Present the ADR before
writing any code. Once accepted, implement a POST /api/v1/trips/:id/packing-list
endpoint that generates a trip manifest from the current rig inventory, and a GET
endpoint that returns the current packing list for a trip.
```

---

## Infrastructure & Database Prompts

### Add a New Migration

```
Read CLAUDE.md and .cursor/rules/vagabond-project-standards.mdc. I need a new
database migration to [DESCRIBE SCHEMA CHANGE]. Current migrations are in
crates/vagabond-server/migrations/ — the latest is [0003_telemetry.sql]. Create
the next migration file following the NNNN_description.sql naming convention.
Do not modify any existing migration file. Include GIST indexes on any new geometry
columns. Use snake_case, UUID primary keys, and TIMESTAMPTZ timestamps per project
standards.
```

### Write a New ADR

```
Read CLAUDE.md, docs/adr/ADR-000-template.md, and the existing ADRs in docs/adr/
to understand the style and numbering. Write a new ADR for the following decision:
[DESCRIBE THE DECISION]. The ADR should cover: context (what problem and what
forces), decision (what we chose), consequences (what gets easier, what gets harder),
and alternatives considered. Status should be "Proposed" until we review it together.
```

### Docker Compose Smoke Test

```
Read CLAUDE.md, docker-compose.yml, and .env.example. Walk me through what
`docker compose up` (default profile) will start, what ports are exposed, what
environment variables are required, and what the expected /health response looks
like. Then identify any gaps between the current compose config and what's needed
to run the full MVP stack.
```

---

## Frontend Feature Prompts

### Trips List Page

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- web/vagabond-web/src/app/page.tsx
- web/vagabond-web/src/app/layout.tsx
- web/vagabond-web/package.json

Implement a /trips page using Next.js App Router that fetches trips from
GET /api/v1/trips via React Query, renders a list with trip name, date range, and
status, and handles loading/error/empty states. Use shadcn/ui components and Tailwind
for styling. The API base URL should come from an env var (NEXT_PUBLIC_API_URL).
Do not use any inline styles.
```

### Trip Detail Page with Map

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- web/vagabond-web/src/app/page.tsx
- web/vagabond-web/src/components/Map.tsx  (if it exists)
- web/vagabond-web/package.json

Implement a /trips/[id] page that: fetches the trip from GET /api/v1/trips/:id,
displays trip metadata (name, dates, description), and renders waypoints as markers
on the MapLibre map component. Waypoints come back as GeoJSON — plot them as a
layer on the map and fit the viewport to their bounding box on load. Handle missing
or empty waypoints gracefully (show the map, no crash).
```

---

## Telemetry Prompts

### Telemetry Ingest Endpoint

```
Read CLAUDE.md, .cursor/rules/vagabond-project-standards.mdc, and the following
files before writing any code:
- crates/vagabond-telemetry/src/lib.rs
- crates/vagabond-telemetry/src/model.rs
- crates/vagabond-telemetry/src/ingest.rs
- crates/vagabond-server/src/routes/v1/telemetry.rs
- crates/vagabond-server/migrations/0003_telemetry.sql
- agent/alloy-config/config.alloy
- docs/adr/ADR-002-telemetry-decoupled.md

Implement the POST /api/v1/telemetry/ingest endpoint that accepts OTLP JSON
payloads from the Grafana Alloy agent. Parse position (lat/lon/alt), speed,
heading, and timestamp from the OTLP payload and persist as TelemetryPoints in
PostGIS. The endpoint must accept out-of-order points (Alloy WAL replay). No auth
required on the ingest endpoint — it's an internal agent-facing endpoint per ADR-002.
```

### Alloy Agent Config Review

```
Read CLAUDE.md and agent/alloy-config/config.alloy. Review the current Alloy
config and tell me: what data is being collected, what OTLP endpoint it targets,
how the WAL is configured for offline buffering, and what would need to change to
test this locally against a running vagabond-server instance. Do not modify the
config yet — just give me the analysis.
```

---

## Debugging / Code Review Prompts

### Clippy / Format Pass

```
Read CLAUDE.md. Run `cargo fmt --check` and `cargo clippy -- -D warnings` across
the entire workspace. Report all warnings and errors. For each issue, show the
file, line, and the fix you would apply. Do not make any changes yet — present the
full list for my review first.
```

### Dependency Audit

```
Read CLAUDE.md and the workspace Cargo.toml plus each crate's Cargo.toml. List
all external dependencies with their current versions. Flag any that have newer
versions available, any that are duplicated across crates (and could be unified in
workspace.dependencies), and any that seem inconsistent with the stated tech stack.
```
