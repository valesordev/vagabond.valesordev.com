# US-008: View trip waypoints on map

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Execute |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want my trip’s waypoints drawn on the PMTiles basemap  
so that I can see the plan spatially before and during the trip.

## Acceptance criteria

1. Given a trip with one or more waypoints, when I open the map for that trip, then each waypoint appears at its stored coordinates.
2. Given multiple waypoints, when the map loads, then the view fits (or offers fit) to the waypoint extent without requiring internet geocoding.
3. Given I select a waypoint marker, when the popup/detail opens, then it shows at least the waypoint name (and visited state if US-010 is done).
4. Overlay data comes from Vagabond API / PostGIS — not a third-party places API.

## ADR links

- [ADR-001](../../adr/ADR-001-offline-first-pmtiles.md) — basemap offline
- [ADR-005](../../adr/ADR-005-open-geo-standards.md) — GeoJSON/MVT over open stack

## Out of scope

- Live GPS breadcrumb replay (telemetry / v0.4)
- Editing waypoints by dragging on the map (nice-to-have; not required for DoD)
- Martin MVT layers for non-trip catalog data

## Build notes

- Consume `GET /api/v1/trips/:trip_id/waypoints` (or GeoJSON equivalent if added)
- MapLibre GeoJSON source/layer on top of PMTiles basemap
- Depends on US-002 / US-007 for meaningful manual QA
