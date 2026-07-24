# US-009: Add a field note for a trip day

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Log |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to add a text field note for a specific trip day  
so that I can journal conditions and observations without a separate markdown file.

## Acceptance criteria

1. Given a trip and a calendar date, when I create or upsert a field log entry with note text, then it is stored keyed by `(trip_id, date)` (or equivalent unique day key) and returned by list/get.
2. Given an existing day log, when I update the note, then the new text is persisted (upsert semantics acceptable).
3. Given the client cannot reach the Vagabond server, when I attempt to save a note, then the UI surfaces that writes require connectivity to the server (Starlink-first / ADR-008) — no silent data loss pretending offline queue exists yet.
4. Photos and actuals (power/water) fields may exist in schema later; v0.1 AC only requires notes for a trip day.

## ADR links

- [ADR-008](../../adr/ADR-008-offline-field-logging.md) — Starlink-first writes; maps offline; no PWA queue in v0.1

## Out of scope

- Client-side offline write queue / service worker (v0.3+)
- Photo attachments (MinIO / storage profile)
- Daily actuals + calibration loop (v0.3)
- Typed trip events journal (ADR-013) — separate from daily FieldLog

## Build notes

- API: `/api/v1/trips/:trip_id/logs` in `trips.rs`
- Tests: `crates/vagabond-server/tests/field_log_api.rs`
- UI: Field Log screen — show clear online/LAN requirement banner when save fails
