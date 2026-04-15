# ADR-008: Offline Field Logging Strategy

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Brian (initial)

## Context

Vagabond is offline-first (ADR-001), and field logging — notes, observations, actuals — is
a core in-field use case. However, "offline" means different things in practice:

- **At camp on Starlink**: connected, but via a portable terminal on battery. The web app
  works normally. This is the primary field scenario.
- **In the backcountry without Starlink**: no connectivity at all. OsmAnd handles navigation.
  The question is whether Vagabond needs to work here too.
- **In transit between camp and home**: intermittent connectivity. Not a primary use case
  for logging.

The implementation cost of true offline write capability (PWA service worker + IndexedDB
+ sync) is significant: conflict resolution, storage management, sync failure handling,
and the additional surface area that creates in tests and deployment.

## Decision

**v0.1–v0.2: Starlink-first with offline map reads.**

The web app is a standard Next.js application. No service worker, no IndexedDB, no offline
write queue.

Offline capability is scoped to:
- **Maps**: PMTiles base layer is served locally from the Docker Compose stack and is fully
  accessible without internet (existing ADR-001)
- **Trip data reads**: the Next.js app can be accessed on the local Docker Compose network
  (home or Starlink LAN) with no outbound internet required
- **Field logging writes**: require the Vagabond server to be reachable — either on Starlink
  LAN at camp or on home network

This is explicitly sufficient for the primary use case: Brian runs Vagabond on his home
server, accesses it over Starlink at camp, and logs field notes in real time.

**True offline write support (PWA) is deferred to v0.3+**, when the field logging data
model is stable enough to design a sync protocol without constant revision.

**`FieldLog` schema** (v0.1, server-side):

```
FieldLog
  ├── id: Uuid
  ├── trip_id: Uuid
  ├── user_id: Uuid
  ├── log_date: Date
  ├── notes: Option<String>
  ├── actual_power_consumed_wh: Option<f64>
  ├── actual_water_consumed_gal: Option<f64>
  ├── actual_weather: Option<String>       (free text for now; structured in v0.3)
  ├── waypoints_visited: Vec<Uuid>         (location IDs or waypoint IDs)
  └── created_at: DateTime<Utc>
```

Photo attachments are deferred to v0.2 (requires MinIO/object storage integration).

## Consequences

**Positive**
- No sync complexity in v0.1 — standard HTTP writes, no conflict resolution
- The data model can evolve freely through v0.1/v0.2 without being locked to a sync
  protocol prematurely
- Standard Next.js app is simpler to deploy, test, and debug
- Matches actual usage pattern: Starlink is on at camp for the work window anyway

**Negative**
- If Starlink goes down mid-log, the entry is lost (browser state only) — acceptable for v0.1
- No capability for truly disconnected logging (e.g., hiking without the truck)
- Defers a genuine user need; must be revisited before the app is used in areas with
  no connectivity option at all

## Alternatives Considered

- **PWA + service worker + IndexedDB (offline-first writes)**: correct long-term, but adds
  significant complexity before the data model is stable; sync protocol design alone is
  a non-trivial ADR; deferred to v0.3+
- **Native mobile app (iOS/Android)**: would solve offline writes natively, but adds an
  entire platform to maintain; out of scope for this project
- **Local-only SQLite in the browser (WASM)**: interesting but bleeding-edge; no clear
  sync path to the server database; rejected
