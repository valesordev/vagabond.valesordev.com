# ADR-009: Google Calendar Integration

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Brian (initial)

## Context

Trip planning should produce calendar events that block time in Google Calendar: driving
days, camp nights, and the pre-trip logistics window. Today this is done manually. Vagabond
should generate and maintain these events automatically when a trip is created or updated.

Design questions:
1. OAuth2 token management — where are credentials stored, how is refresh handled?
2. Sync direction and trigger — push only or bidirectional? On-save or manual?
3. Drive time — calculated automatically or entered manually?
4. Non-Google users — how is this handled?

## Decision

**One-way push from Vagabond to Google Calendar. Vagabond is the source of truth.**

Changes in Google Calendar are not propagated back to Vagabond. Trip edits in Vagabond
overwrite the corresponding calendar events. This avoids bidirectional sync complexity
entirely.

**OAuth2 token storage:**
- Google OAuth2 tokens (access + refresh) are stored encrypted in PostgreSQL against the
  `users` table (`google_calendar_token: Option<EncryptedJson>`)
- Encryption key is injected via `VAGABOND_TOKEN_KEY` env var (AES-256-GCM)
- Token refresh is handled server-side on each sync attempt using the stored refresh token
- Google Calendar is an opt-in integration — users who haven't authorized it simply don't
  get calendar sync; the feature is invisible until connected

**Sync trigger:**
- Manual: "Sync to Calendar" button on the trip detail page
- Automatic: triggered on trip save if the user has Google Calendar connected and the trip
  has confirmed dates
- No background polling loop — sync is always user-initiated or save-triggered

**Calendar event structure (one trip → N events):**

```
Driving Day event:
  Title: "🚗 [Trip Name] — Drive to [Destination]"
  Date:  trip leg departure date (all-day)
  Description: route summary, fuel stops, estimated drive time

Camp Night events (one per night):
  Title: "⛺ [Trip Name] — Camp at [Location Name]"
  Date:  camp date (all-day)
  Description: campsite name, coordinates, notes

Pre-trip prep event (optional):
  Title: "📦 [Trip Name] — Prep & Pack"
  Date:  day before departure (all-day)
```

**Drive time calculation:**
- v0.3: estimated drive time is calculated using straight-line distance × a regional
  speed factor constant (not a routing API call) — fast, offline-capable, good enough
- User can override the estimate on any leg
- Actuals logged post-trip feed a per-route calibration (same pattern as ADR-007)
- A proper routing API (OSRM self-hosted or similar) is a v0.4 consideration

**Non-Google users:**
- ICS export is always available as a fallback (one-click download of the trip as .ics)
- ICS export does not require OAuth and works for any calendar system
- The ICS export feature ships in v0.2 (simpler than OAuth); full Google sync ships in v0.3

## Consequences

**Positive**
- One-way push is simple to implement and reason about
- No conflict resolution needed — Vagabond owns the data
- Token storage in PostgreSQL keeps the deployment self-contained (no Redis, no separate
  secrets store for most users)
- ICS fallback ensures the feature is useful before OAuth is wired up

**Negative**
- Requires Google OAuth app registration (client ID/secret) — community users must either
  register their own OAuth app or self-host without calendar sync
- If a user manually edits a calendar event, those edits are overwritten on next sync
- Drive time estimate (distance × factor) is rough; will be noticeably wrong on winding
  mountain roads until calibrated

## Alternatives Considered

- **Bidirectional sync**: would allow editing dates in Google Calendar and having them
  reflect in Vagabond; adds significant complexity (event change detection, conflict
  resolution, webhook registration); rejected for v0.3
- **CalDAV (standard protocol)**: provider-agnostic, would work with any CalDAV server
  (iCloud, Fastmail, Nextcloud); more complex to implement than Google's REST API;
  worth revisiting as a v1.0 addition for community users
- **Google Maps Distance Matrix API for drive times**: accurate routing but introduces
  a paid API dependency and breaks the offline-first principle; rejected in favor of the
  self-hosted distance × factor approach
