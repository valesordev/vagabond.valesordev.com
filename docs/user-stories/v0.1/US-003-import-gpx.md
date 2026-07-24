# US-003: Import a GPX route

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Plan |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to import a GPX file into a trip  
so that routes planned in Caltopo / OsmAnd / Gaia become Vagabond waypoints and track geometry.

## Acceptance criteria

1. Given a trip and a valid GPX 1.1 file with waypoints and/or a track, when I POST multipart to the import endpoint, then waypoints (and route geometry where applicable) are created under a trip leg and returned in the response envelope.
2. Given invalid or empty GPX, when I import, then the API returns 422 (or equivalent) with a machine-readable error — no partial silent success.
3. Given a successful import, when I list trip waypoints, then imported points are queryable with WGS84 coordinates via PostGIS.
4. Import does not require Mapbox/Google APIs; GPX is the interchange format.

## ADR links

- [ADR-005](../../adr/ADR-005-open-geo-standards.md) — GPX primary I/O; dual QA path OsmAnd (project) and Gaia (personal, ADR-016) is a test concern, not a format change

## Out of scope

- KML import (concession later if needed)
- Import into Location catalog (v0.2 / ADR-006)
- Live GPX sync from phone apps

## Build notes

- API: `POST /api/v1/trips/:trip_id/import/gpx`
- Tests: `crates/vagabond-server/tests/gpx_import.rs`
- Verify Gaia and OsmAnd sample GPX round-trips when touching parsers (ADR-016 QA note)
