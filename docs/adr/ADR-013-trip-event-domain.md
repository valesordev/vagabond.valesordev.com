# ADR-013: Trip Event Domain

**Status**: Accepted
**Date**: 2026-05-11
**Deciders**: Brian (initial)

## Context

The `FieldLog` (ADR-008) captures daily aggregates — a single end-of-day entry per
`(trip_id, date)` with rolled-up power, water, and weather data. This serves the budget
calibration loop (ADR-007) well, but it does not serve the in-field journaling use case:
discrete, timestamped moments that happen throughout a day.

In practice, a trip generates a stream of events with no natural daily boundary: depart at
0430, fuel fill at 0645, rest area at 0930, coffee stop at 1130, campsite arrival at 1815,
vehicle issue noticed at 0930 the next morning. These events have types, optional durations,
optional geopoints, and type-specific structured metadata (fuel gallons, odometer, trail
distance, etc.). None of them are well-served by the daily aggregate model.

The GA Pickup trip (May 2026) was the forcing function: we wanted to capture exactly this
kind of record during the trip so the data could inform planning feature design going forward.
The decision was made to build the event domain before departure rather than retrofit it from
notes after the fact.

Key constraints:
- Event types must be extensible without new migrations for each new type
- Each event may have a GPS location (or not)
- Events can be instantaneous (`fuel_fill`) or duration-bounded (`hike`, `campsite`)
- The event journal must be independent of `FieldLog` — they are complementary, not
  competing. Eventually, event aggregates can auto-populate `FieldLog` actuals.
- Offline-first: events must be writable to a local server (Pi edge stack) without internet

## Decision

### Single `trip_events` table with typed JSONB payload

```sql
CREATE TABLE trip_events (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type   TEXT        NOT NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at     TIMESTAMPTZ,
    location     GEOMETRY(Point, 4326),
    notes        TEXT,
    payload      JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`event_type` is a free-text discriminant. Initial set of first-class types:

| Type | Meaning | Key payload fields |
|------|---------|-------------------|
| `trip_start` | Trip departure | odometer_start |
| `trip_end` | Trip conclusion | odometer_end |
| `fuel_fill` | Fueling stop | gallons, price_per_gallon, odometer_miles |
| `water_fill` | Water resupply | gallons, source |
| `stop` | Rest area / meal / any pause | stop_type, duration_minutes |
| `campsite` | Overnight stop | site_type (dispersed/established/stealth), nights |
| `hike` | Trail activity | trail_name, distance_miles, elevation_gain_ft |
| `vehicle_issue` | Mechanical / warning | severity (low/medium/high), description |
| `note` | Freeform observation | (notes field only; empty payload) |

New types are added by documenting the payload shape — no migration required.

### Rust `EventPayload` enum in `vagabond-core`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EventPayload {
    TripStart { odometer_miles: Option<f64> },
    TripEnd   { odometer_miles: Option<f64> },
    FuelFill  { gallons: f64, price_per_gallon: Option<f64>, odometer_miles: Option<f64> },
    WaterFill { gallons: f64, source: Option<String> },
    Stop      { stop_type: StopType, duration_minutes: Option<u32> },
    Campsite  { site_type: CampsiteType, nights: Option<u32> },
    Hike      { trail_name: Option<String>, distance_miles: Option<f64>, elevation_gain_ft: Option<f64> },
    VehicleIssue { severity: IssueSeverity, description: String },
    Note {},
}
```

`StopType`, `CampsiteType`, and `IssueSeverity` are simple string-backed enums in
`vagabond-core`. Unknown `event_type` values round-trip as raw JSONB — no deserialization
failure on forward-compatibility.

### API endpoints

```
GET    /api/v1/trips/:id/events                   list events (supports ?event_type=fuel_fill)
POST   /api/v1/trips/:id/events                   create event
GET    /api/v1/trips/:id/events/:event_id          get event
PUT    /api/v1/trips/:id/events/:event_id          update event
DELETE /api/v1/trips/:id/events/:event_id          delete event
```

### Crate placement

- `TripEvent`, `EventPayload`, enum types → `vagabond-core::trip_event`
- Repository functions → `vagabond-server::repository::trip_event`
- HTTP handlers → `vagabond-server::routes::v1::trips` (added alongside existing handlers)
- Migration → `0005_trip_events.sql`

### Relationship to `FieldLog`

`FieldLog` is retained as the end-of-day aggregate. In a future release, a reconciliation
function will sum `fuel_fill.gallons` and `water_fill.gallons` events for the day and offer
to pre-fill the corresponding `FieldLog` actuals. For now they are independent.

## Consequences

**Positive**
- In-field event capture is now first-class — typed, queryable, geolocated
- JSONB payload is forward-compatible: new event types add no migration overhead
- Events and FieldLog are complementary; the daily aggregate can eventually be derived
  from events rather than entered manually
- GPS pins on events feed naturally into the telemetry/map layer (ADR-002)
- Fuel and water event streams close the budget calibration loop (ADR-007) from real data

**Negative**
- `event_type` as free text instead of a DB-level enum trades strict enforcement for
  extensibility — enforced by Rust enum at application layer only
- JSONB payload loses compile-time field checking beyond the Rust enum boundary; unknown
  payloads deserialize to raw JSON
- `FieldLog` and `TripEvent` are now two separate write surfaces; UX must make the
  distinction clear

**Offline-first**: Event creation hits the local server (Pi edge stack, ADR-014) — no
internet required. Events buffer in the local Postgres instance and can be reviewed
offline via the web UI on the same local network.

**Grafana/Alloy seam**: Unaffected. Telemetry (GPS track, power stats) remains in
`telemetry_sessions`/`telemetry_points`. Trip events are user-initiated, not sensor-driven.

## Alternatives Considered

- **Extend `FieldLog` with a `events: Vec<_>` array column**: collapses the event stream
  into the daily aggregate model — loses timestamp precision and the geo point per event.
  Rejected: the GA trip experience proved that "when during the day" matters.

- **Separate table per event type** (`fuel_fills`, `hikes`, etc.): strong DB-level type
  enforcement but a new migration and join for every new event type. The extensibility cost
  is too high for an evolving event vocabulary. Rejected.

- **Reuse `Waypoint` with a `waypoint_type` discriminant**: waypoints are planning-time
  entities (they go on the planned route). Events are field-time records (they describe what
  actually happened). Collapsing these conflates plan and actuals — the distinction matters
  for the budget calibration feedback loop. Rejected.
