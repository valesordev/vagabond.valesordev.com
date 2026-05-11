# ADR-012: WorkStop Routing Model

**Status**: Accepted
**Date**: 2026-05-11
**Deciders**: Brian (initial)

## Context

The primary automation goal of Vagabond is location independence for a remote worker who
lives on the road. If the app can guarantee that scheduled work obligations are satisfied
regardless of physical location, the route becomes a free variable — that is true vagabonding.

Today this is solved manually: the GA Pickup trip (May 2026) required engineering three
meeting blocks into the route by hand — choosing specific parking locations in Lordsburg NM
and Weatherford TX, estimating arrival times, identifying fallback locations, and maintaining
30-min setup buffers and 15-min decompression windows in a Notion doc. Each scheduling
change cascaded through the entire route plan by hand.

This is the central planning problem Vagabond must solve:

> **Meeting blocks are time-anchored constraints on the route, not just annotations on a
> waypoint. A route is only valid if every meeting block has a reachable location with the
> required connectivity and sufficient buffer windows.**

Two design questions arise from this:

1. **Data model** — How are meeting blocks and work stops represented? Where do they live in
   the domain?

2. **Routing model** — Is Vagabond passive (user places work stops, system warns if timing
   is wrong) or active (system proposes work stop locations from the meeting schedule)? And
   when does each mode apply?

Additional constraints from the GA Pickup trip that any model must handle:

- **Time zone drift.** A 3-day drive crosses +3 hours (PDT → EDT). All meeting times are
  anchored to the user's home time zone (PDT) regardless of the truck's current location.
  The system must resolve geographic TZ automatically — the manual "all times in PDT" 
  convention in the trip doc is a fragile workaround.

- **Connectivity heterogeneity.** Some meetings require Starlink (reliable, but needs open
  sky and ~10-min setup); others are cellular-ok (simpler but coverage is patchy in NM/TX
  remote stretches). These requirements differ per meeting, not per stop.

- **Fallback locations.** If the primary work stop location is unsuitable (bad Starlink sky
  view, unexpected construction, enforced parking), a pre-planned fallback location is
  needed. The Lordsburg → Deming contingency on the GA trip is the canonical example.

- **Buffer asymmetry.** Pre-buffer (connectivity verification + setup) is longer than
  post-buffer (decompress, pack up, re-enter traffic). Defaults differ: ~30 min pre, ~15
  min post.

## Decision

### MeetingBlock is a first-class trip entity

`MeetingBlock` attaches to a `Trip`, not to a `Waypoint`. This is intentional: the meeting
schedule is a planning input that constrains the route. The system must know all meeting
blocks before a route can be validated.

```
MeetingBlock {
    id:                       Uuid,
    trip_id:                  Uuid,
    title:                    String,
    scheduled_at_utc:         DateTime<Utc>,     // always stored UTC
    duration_minutes:         u32,
    connectivity_requirement: ConnectivityRequirement,
    notes:                    Option<String>,
}

ConnectivityRequirement {
    Starlink,       // open sky, 10-min setup, primary for long calls
    CellularOk,     // Verizon/fallback acceptable; simpler but coverage-dependent
    Any,            // no connectivity constraint (audio-only mobile, etc.)
}
```

### WorkStop is a Waypoint sub-type

`WorkStop` is a `Waypoint` with additional fields. It holds references to one or more
`MeetingBlock` IDs, plus buffer windows and an optional fallback location.

```
WorkStop {
    // inherits all Waypoint fields (id, trip_id, location, name, notes, order)
    meeting_block_ids:  Vec<Uuid>,             // the meetings happening at this stop
    pre_buffer_minutes: u32,                   // default 30; connectivity setup
    post_buffer_minutes: u32,                  // default 15; decompression
    fallback_location:  Option<Point>,         // pre-identified backup spot
    fallback_notes:     Option<String>,        // e.g. "Deming NM, 60mi east on I-10"
}
```

`WorkStop` location can be `None` during planning (TBD — user will confirm en route). A
`None` location is valid but the feasibility check cannot be run until it is set.

### Time zone resolution is automatic and geographic

All `MeetingBlock.scheduled_at_utc` values are stored in UTC. When computing route timing,
the system resolves the local time at a `WorkStop` location using its geographic coordinates
and a TZ boundary dataset (e.g. timezone-boundary-builder or equivalent). The user-facing
display always shows both the meeting's home-TZ time (PDT) and the local time at the stop.

Manual TZ tracking is not required from the user.

### v0.3: Constraint-feasibility model (passive)

For v0.3, Vagabond is a **constraint validator**, not a constraint solver. The user places
`WorkStop` waypoints in the route manually. The system:

1. Computes estimated arrival time at each `WorkStop` based on the route and prior stops
2. Checks: `arrival_time + pre_buffer ≤ first meeting block start`
3. Checks: `last meeting block end + post_buffer ≤ departure_time` (where departure_time
   is arrival_time at the next waypoint minus travel time to reach it by its planned time)
4. Surfaces a **feasibility warning** on any `WorkStop` that violates either constraint
5. Shows the timing margin (how many minutes of slack exist in each buffer window)

A route with unsatisfied meeting constraints is surfaced as a planning warning, not a
blocking error — the user may choose to accept the risk (e.g., departing late and relying
on a fallback) or adjust the route.

Drive time estimates use the same calculation as ADR-009 (Google Calendar sync). No new
routing engine is introduced.

### v0.4+: Constraint-driven placement (active) — decision deferred

For a future release, the system will accept a meeting schedule and **propose** `WorkStop`
locations automatically — finding points along the route corridor that satisfy timing
constraints and score well on connectivity viability (cellular coverage maps, terrain
analysis for Starlink sky view).

The "find a Starlink-viable parking spot near me now" feature is also deferred to v0.4 —
it requires live location, a connectivity scoring model, and POI search, which are a
meaningfully larger scope than the feasibility model.

These decisions are deferred because:
- The connectivity scoring model (especially Starlink sky view quality at arbitrary locations)
  requires data and research not yet in scope
- The feasibility model already eliminates the most painful part of the current workflow
  (manual timing math)
- Automatic placement requires a route optimization layer that doesn't yet exist

### Crate placement

- `MeetingBlock`, `WorkStop`, `ConnectivityRequirement` domain types → `vagabond-core`
- `WorkStop` feasibility check function → `vagabond-core::routing` (new module)
- CRUD API handlers for `MeetingBlock` and `WorkStop` → `vagabond-server`
- DB migration: `meeting_blocks` table + `work_stop_extensions` table extending `waypoints`
  → new migration in `crates/vagabond-server/migrations/`

`WorkStop` is stored as a `Waypoint` row with `waypoint_type = 'work_stop'` plus a joined
row in `work_stop_extensions`. This avoids a separate table for every waypoint variant while
keeping extension fields clean.

## Consequences

**Positive**

- The primary use case — working from anywhere — has a first-class data model and a
  planning workflow that eliminates manual timing math
- Feasibility warnings catch schedule mismatches at planning time, not 30 minutes before
  a meeting in a remote desert
- Storing meeting times in UTC with geographic TZ resolution eliminates a category of
  user error (the GA trip "all times in PDT" convention)
- `MeetingBlock` as a trip-level entity (not attached to a waypoint) means the system can
  reason about the full schedule — useful when the system eventually proposes work stop
  placements in v0.4
- `fallback_location` is a first-class field rather than a note, so the system can display
  the fallback on the map and potentially compute its timing too

**Negative**

- `WorkStop` as a `Waypoint` sub-type adds a join to every waypoint query that needs to
  check for meeting blocks; mitigated by the `waypoint_type` discriminator
- Drive time estimates inherit the limitations noted in ADR-009: they are estimates, not
  live traffic data. A meeting feasibility check is only as good as its drive time
  estimate — tight buffers may be violated in practice
- Connectivity feasibility (especially Starlink sky view) cannot be validated at planning
  time in v0.3; the system can only warn on timing, not on whether the chosen spot actually
  has line-of-sight. User judgment required until v0.4 connectivity scoring.
- The deferred v0.4 active placement feature means users must still manually choose work
  stop locations in v0.3, which is better than today (no validation) but not yet fully
  automated

**Does not affect offline-first**: All `MeetingBlock` and `WorkStop` data is local to the
trip. Feasibility checking is a pure in-memory calculation. No connectivity required.

## Alternatives Considered

- **WorkStop as an annotated waypoint (no constraints, no feasibility check):** Eliminates
  the routing complexity but solves nothing — the user still does all the timing math
  manually. This is the markdown workflow with extra UI. Rejected.

- **Full constraint-driven route planning for v0.3:** Would require a routing optimization
  engine, connectivity scoring data, and a POI search layer — a 3–4× larger scope than the
  feasibility model. The feasibility model eliminates the most painful manual work; active
  placement is a force multiplier on top of a working foundation. Deferred to v0.4.

- **MeetingBlock attached to WorkStop (not Trip):** Prevents the system from reasoning
  about the full schedule before work stop locations are chosen. Also creates circular
  dependency if work stop locations are eventually derived from the meeting schedule.
  Rejected.

- **Use Google Calendar as the source of truth for meeting blocks (pull from GCal, don't
  store in Vagabond):** Attractive since meetings are already in GCal, but creates a hard
  dependency on external connectivity for a planning-time feature. Violates the offline-
  first constraint for trip planning. Vagabond should import from GCal (a sync, not a live
  query) and own the local copy. Deferred integration design.
