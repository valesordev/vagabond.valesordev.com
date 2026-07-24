# US-002: Add waypoints to a trip

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Plan |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to add ordered waypoints (with coordinates) to a trip leg  
so that I can sketch a route without leaving Vagabond.

## Acceptance criteria

1. Given a trip, when I create a leg and add a waypoint with name, lat, lon (WGS84), then the waypoint is stored with PostGIS geometry (`EPSG:4326`) and listed in order for that leg.
2. Given a trip with legs, when I list all waypoints for the trip, then I receive every waypoint across legs with stable ids and coordinates.
3. Given a waypoint I own, when I update or delete it, then the change is reflected on subsequent list/get.
4. Given coordinates outside valid lat/lon ranges, when I create a waypoint, then the API rejects the request with a clear error.
5. Waypoint GeoJSON/API responses use open geo conventions (no proprietary coordinate systems).

## ADR links

- [ADR-005](../../adr/ADR-005-open-geo-standards.md) — WGS84, PostGIS geometry, open interchange

## Out of scope

- WorkStop subtype and meeting buffers (ADR-012 / v0.3)
- Linking waypoints to Location catalog entries (ADR-006 / v0.2)
- Turn-by-turn navigation inside Vagabond

## Build notes

- API: `/api/v1/trips/:trip_id/legs`, `/legs/:leg_id/waypoints`, `/trips/:trip_id/waypoints`
- Tests: `crates/vagabond-server/tests/waypoint_api.rs`
- Spatial storage must stay in PostGIS — no app-layer geo math for persistence
