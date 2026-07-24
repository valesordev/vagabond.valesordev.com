# US-010: Mark a waypoint as visited

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Log |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to mark a planned waypoint as visited  
so that I can tell planned vs completed stops without rewriting the route.

## Acceptance criteria

1. Given a trip waypoint, when I mark it visited (with optional visited-at timestamp), then GET waypoint/list shows visited state.
2. Given a visited waypoint, when I clear visited, then it returns to unvisited.
3. Marking visited requires a reachable server (same write boundary as ADR-008); failure is visible in the UI.
4. Visited state does not delete or reorder the waypoint.

## ADR links

- [ADR-008](../../adr/ADR-008-offline-field-logging.md) — field writes need server reachability in v0.1

## Out of scope

- Auto-detect arrival via GPS geofence
- Trip events of type `arrived` as a parallel journal (ADR-013) — optional later enrichment
- Post-trip debrief form

## Build notes

- Extend waypoint update payload with `visited` / `visited_at` if not already present — verify schema and `waypoint_api` tests
- Map popup (US-008) should reflect visited state when both are implemented
