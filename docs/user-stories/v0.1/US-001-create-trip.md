# US-001: Create / edit / delete a trip

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Plan |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to create, edit, and delete trips with dates and a name  
so that I can replace my markdown trip folders with a durable plan I can open later.

## Acceptance criteria

1. Given I am authenticated, when I create a trip with a name and optional start/end dates, then the API returns the trip in the standard `{ data, meta, error }` envelope and the trip appears in my trip list.
2. Given an existing trip I own, when I update its name or dates, then subsequent GET returns the updated fields.
3. Given an existing trip I own, when I delete it, then GET by id returns not-found and it no longer appears in the list.
4. Given invalid input (empty name), when I create or update, then the response uses a machine-readable error code and an HTTP 4xx status.
5. Trip records persist across server restart (Postgres-backed).

## ADR links

None required for basic CRUD. Envelope/error conventions follow project API standards in CONTRIBUTING.

## Out of scope

- Journey vs destination trip mode (v0.2)
- Travel companions, work schedule, budgets, calendar sync
- Soft-delete / archive semantics beyond hard delete for v0.1

## Build notes

- API: `GET/POST /api/v1/trips`, `GET/PUT/DELETE /api/v1/trips/:trip_id` in `crates/vagabond-server/src/routes/v1/trips.rs`
- Domain types: `crates/vagabond-core` trip module
- Tests: `crates/vagabond-server/tests/trip_api.rs` (verify against current code)
- UI: trip list / trip detail screens under `web/vagabond-web/`
