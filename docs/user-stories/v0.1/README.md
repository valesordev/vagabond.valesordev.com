# v0.1 — Better Markdown

The minimum to replace the markdown + OsmAnd workflow for day-to-day trip planning and field notes.

## Definition of done

Brian can create a trip, lay out a route (waypoints + GPX), manage rig/gear/power profile, view the trip on an offline PMTiles map, and take basic field notes — without touching markdown.

**Offline boundary (ADR-008):** map tiles and reads work without internet when the local stack (or Starlink LAN server) is reachable. Writes require a reachable Vagabond server. True client-only offline writes (PWA) are deferred.

## Story index

| ID | Title | Backbone | ADRs |
|----|-------|----------|------|
| [US-001](US-001-create-trip.md) | Create / edit / delete a trip | Plan | — |
| [US-002](US-002-add-waypoints.md) | Add waypoints to a trip | Plan | [005](../../adr/ADR-005-open-geo-standards.md) |
| [US-003](US-003-import-gpx.md) | Import a GPX route | Plan | [005](../../adr/ADR-005-open-geo-standards.md) |
| [US-004](US-004-rig-profile.md) | Create / update rig profile | Manage Rig | — |
| [US-005](US-005-gear-inventory.md) | Manage gear inventory | Manage Rig | — |
| [US-006](US-006-power-system.md) | Define power system on rig | Manage Rig | [007](../../adr/ADR-007-budget-calculation-engine.md) |
| [US-007](US-007-offline-map.md) | View offline map (PMTiles) | Execute | [001](../../adr/ADR-001-offline-first-pmtiles.md), [005](../../adr/ADR-005-open-geo-standards.md) |
| [US-008](US-008-waypoints-on-map.md) | View trip waypoints on map | Execute | [001](../../adr/ADR-001-offline-first-pmtiles.md), [005](../../adr/ADR-005-open-geo-standards.md) |
| [US-009](US-009-field-note.md) | Add a field note for a trip day | Log | [008](../../adr/ADR-008-offline-field-logging.md) |
| [US-010](US-010-mark-waypoint-visited.md) | Mark a waypoint as visited | Log | [008](../../adr/ADR-008-offline-field-logging.md) |
| [US-011](US-011-keycloak-auth.md) | Authenticate via Keycloak | Infra | [004](../../adr/ADR-004-auth-keycloak.md) |
| [US-012](US-012-compose-deploy.md) | Single-command Compose deploy | Infra | [003](../../adr/ADR-003-grafana-optional-sidecar.md), [004](../../adr/ADR-004-auth-keycloak.md) |

## Explicitly not in v0.1

Promote these only when writing later release story packs:

- Location catalog, jurisdiction tags, transit sleep stops (ADR-006 → v0.2)
- Calculated power/water/food budgets and packing lists (ADR-007 UI → v0.2)
- Travel companions, trip mode journey vs destination (v0.2)
- Google Calendar sync (ADR-009 → v0.3)
- Work stops / meeting blocks (ADR-012 → v0.3)
- Trip events journal (ADR-013 → later; distinct from daily field notes)
- Pi edge flash/OTA (ADR-014, ADR-015)
- Agentic location research (ADR-011 → v0.4)
- Community campsite sharing (deferred)

## Source

Promoted from parent planning `story-map-interview.md` release slice “v0.1 — Better Markdown,” constrained by Accepted ADRs in this repo.
