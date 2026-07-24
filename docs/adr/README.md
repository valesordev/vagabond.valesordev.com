# Architecture Decision Records

ADRs record significant technical decisions. Use [ADR-000-template.md](ADR-000-template.md) for new entries. Number sequentially; never reuse a number.

| ADR | Title | Status | Date | Summary |
|-----|-------|--------|------|---------|
| [000](ADR-000-template.md) | Template | Template | — | Context / Decision / Consequences / Alternatives skeleton. |
| [001](ADR-001-offline-first-pmtiles.md) | Offline-First Map Tiles via PMTiles | Accepted | 2026-03-20 | Bundle OSM base as local PMTiles; MapLibre range-fetches; Martin serves PostGIS MVT overlays. |
| [002](ADR-002-telemetry-decoupled.md) | Telemetry Decoupled from Trip Planning | Accepted | 2026-03-20 | Planning and telemetry are separate bounded contexts; telemetry annotates trips via `trip_id`, never mutates plan data. |
| [003](ADR-003-grafana-optional-sidecar.md) | Grafana as Optional Observability Sidecar | Accepted | 2026-03-20 | Grafana/Prometheus/Alloy behind `--profile observability`; core stack has no Grafana dependency. |
| [004](ADR-004-auth-keycloak.md) | Authentication via Keycloak | Accepted | 2026-03-20 | Keycloak is reference OIDC (`--profile auth`); BYO OIDC supported; `VAGABOND_DEV_AUTH` for local/edge. |
| [005](ADR-005-open-geo-standards.md) | Open Geo Standards Throughout | Accepted | 2026-03-20 | GPX, GeoJSON, OSM/PMTiles/MapLibre/MVT, NMEA, WGS84; no proprietary map lock-in. Field-nav row partially superseded by ADR-016. |
| [006](ADR-006-location-catalog-domain.md) | Location Catalog Domain Structure | Accepted | 2026-04-15 | Cross-trip Location catalog in core types + `vagabond-locations` crate; trips reference locations by ID. |
| [007](ADR-007-budget-calculation-engine.md) | Budget Calculation Engine | Accepted | 2026-04-15 | Pure functions in `vagabond-core` for power/water/food; FieldLog actuals feed calibration. |
| [008](ADR-008-offline-field-logging.md) | Offline Field Logging Strategy | Accepted | 2026-04-15 | v0.1–v0.2: Starlink-first — maps offline, writes need reachable server; PWA deferred. |
| [009](ADR-009-google-calendar-integration.md) | Google Calendar Integration | Accepted | 2026-04-15 | One-way Vagabond→GCal push; ICS first, OAuth later; Vagabond remains source of truth. |
| [010](ADR-010-telemetry-third-party-integrations.md) | Telemetry via Third-Party API Integrations | Accepted | 2026-04-15 | Source-agnostic ingest: manual FieldLog → Jackery/Starlink pollers → Alloy sensors later. |
| [011](ADR-011-agentic-location-research.md) | Agentic Location Research Pipeline | Proposed — Deferred to v0.4 | 2026-04-15 | Opt-in LLM enrichment of Locations after catalog is stable; user-reviewable, never silent for safety-critical access. |
| [012](ADR-012-workstop-routing-model.md) | WorkStop Routing Model | Accepted | 2026-05-11 | `MeetingBlock` + `WorkStop` waypoint subtype; v0.3 passive feasibility checks; active placement deferred. |
| [013](ADR-013-trip-event-domain.md) | Trip Event Domain | Accepted | 2026-05-11 | Typed `trip_events` with JSONB payloads; complementary to daily FieldLog; Pi-local writes. |
| [014](ADR-014-pi-edge-deployment.md) | Raspberry Pi Edge Deployment | Accepted | 2026-05-11 | `--profile edge` / Pi compose: core stack on LAN; single-user auth; never expose edge auth to the internet. |
| [015](ADR-015-rig-native-build-system.md) | Rig-Native Build System | Accepted | 2026-05-11 | Flashable Pi image builder + OTA compose pull; USB offline image transfer. |
| [016](ADR-016-personal-nav-stack-divergence.md) | Personal Field Navigation Stack Diverges from Project Recommendation | Accepted | 2026-05-21 | Project still recommends OsmAnd; Brian’s personal stack is Apple Maps + Gaia (partial supersede of ADR-005 field-nav row). |

## Notes

- ADR-016 was previously mis-numbered as a second ADR-013; trip-event domain keeps **013**.
- New ADRs go next as **017+**.
