# ADR-002: Telemetry Decoupled from Trip Planning

**Status**: Accepted  
**Date**: 2026-03-20  
**Deciders**: Brian (initial)

## Context

Vagabond has two distinct use modes:

1. **Pre-trip planning** — desktop/home, full connectivity, planning routes and packing lists
2. **In-field tracking** — RPi agent in the 4Runner, intermittent connectivity, streaming GPS
   and sensor data back to the server

Early drafts coupled these tightly: a trip required an active telemetry session, and
telemetry writes updated trip state directly. This created a hard dependency where planning
features couldn't ship until the telemetry pipeline was complete, and a buggy ingest path
could corrupt trip data.

## Decision

Treat trip planning and live telemetry as **separate bounded contexts** with a clean seam:

- **Trip planning** (routes, waypoints, campsites, gear) is fully functional with no telemetry
- **Telemetry ingest** (`vagabond-telemetry` crate, `/api/v1/telemetry/ingest` endpoint)
  writes to its own `telemetry_sessions` / `telemetry_points` tables
- Telemetry *annotates* a trip post-hoc via a `trip_id` foreign key on `telemetry_sessions`
  — it never mutates trip planning data
- The live tracking map overlay is a read-only projection of telemetry points onto the
  existing trip map view; no shared write path

## Consequences

**Positive**
- MVP v0.1 ships useful planning features with zero telemetry work
- Telemetry pipeline failures can't corrupt trip/route data
- `vagabond-telemetry` crate can be developed and tested independently
- Aligns with ADR-003: Grafana observability is also optional/decoupled

**Negative**
- Displaying "where am I on my planned route" requires a join across the seam
  (telemetry_points ↔ routes via PostGIS `ST_Distance` or `ST_LineLocatePoint`)
- Two ingest paths means two sets of DB migrations to keep in sync
- Replay/post-processing of telemetry into trip statistics requires an explicit
  projection step (a background job, not a live query)

## Alternatives Considered

- **Coupled model**: trip has a live `current_position` field updated by telemetry ingest.
  Rejected: creates a write-contention hot spot and blocks MVP planning features on v0.2 work.
- **Separate service**: telemetry as its own microservice with its own DB.
  Rejected: over-engineering for a self-hosted single-operator tool; shared PostGIS instance
  is fine, crate boundary gives sufficient separation without the ops overhead.
