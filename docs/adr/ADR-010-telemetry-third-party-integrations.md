# ADR-010: Telemetry via Third-Party API Integrations

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Brian (initial)

## Context

ADR-002 established that telemetry is decoupled from trip planning and ingested via a
Grafana Alloy agent on a Raspberry Pi. The assumed architecture was: Pi reads physical
sensors (GPS puck, Victron BMS, etc.) → Alloy formats as OTLP → pushes to
`vagabond-server /ingest`.

The actual hardware situation in 2026:
- Raspberry Pi is available
- No physical sensors are attached
- The two primary power data sources are Jackery power stations (1000v2, 2000v2) and
  Starlink Mini — both are commercial products with potential API or app integration surfaces

Custom sensor hardware (GPS puck, current shunts, Victron Cerbo) is a future build-out,
not a current reality.

The question is how to get useful telemetry data without custom hardware.

## Decision

**The telemetry ingest protocol becomes source-agnostic. Three integration paths are
supported, in priority order:**

**Path 1 — Manual entry (v0.3)**
The `FieldLog` (ADR-008) already captures `actual_power_consumed_wh` and
`actual_water_consumed_gal` as daily user-entered values. This is the baseline: no
integration required, works with any hardware. Ship this first.

**Path 2 — Third-party API pollers (v0.4, conditional on API availability)**
If Jackery or Starlink expose usable APIs (app-level, reverse-engineered, or official):

- A poller process (Tokio task in `vagabond-server`, or a separate lightweight binary)
  periodically fetches state-of-charge and usage data and writes it to the telemetry
  tables via the same ingest path as Alloy
- Jackery: no official public API as of 2026-04; feasibility requires investigation
- Starlink: Starlink Mini exposes a local gRPC interface (documented by the community)
  at `192.168.100.1:9200` — this is the most immediately viable integration

**Path 3 — Alloy agent (v0.4, when physical sensors are added)**
The ADR-002 Alloy architecture remains the long-term target for when physical sensors
(GPS, BMS) are added to the rig. No changes to the OTLP ingest endpoint design are
required — it already accepts generic metric payloads.

**Ingest envelope (unchanged from ADR-002 intent, now made explicit):**

```
POST /api/v1/ingest
{
  "session_id": "uuid",
  "source": "alloy" | "jackery_poller" | "starlink_poller" | "manual",
  "points": [
    {
      "ts": "2026-04-08T14:32:00Z",
      "metric": "power.soc_pct" | "power.consumed_wh" | "starlink.uptime_s" | ...,
      "value": 84.2,
      "tags": { "device": "jackery_2000" }
    }
  ]
}
```

The `source` field is informational only — the ingest handler does not branch on it.

## Consequences

**Positive**
- Telemetry is useful in v0.3 without any hardware beyond what already exists (Pi + Starlink)
- Starlink local gRPC is immediately accessible at camp (no API key, local network only)
- The ingest envelope is stable regardless of which source feeds it — Alloy integration
  requires no API changes when hardware is eventually added
- Manual entry (FieldLog) provides data for calibration even if no integration is built

**Negative**
- Third-party API availability is not guaranteed: Jackery has no public API; Starlink local
  gRPC is undocumented and may change with firmware updates
- Without hardware sensors, position tracking (the core of "live tracking") is not possible
  in v0.4 — that requires a GPS source
- Reverse-engineered APIs carry maintenance risk and no SLA

## Alternatives Considered

- **Wait for physical sensors before building any telemetry**: defers useful data until an
  unknown future date; rejected in favor of the manual → API → hardware progression
- **Use phone GPS via browser Geolocation API**: viable for position tracking while the web
  app is open; not suitable for background or continuous tracking; may revisit for v0.4
- **OsmAnd track export + GPX import**: OsmAnd can record tracks and export GPX; this is
  a viable "poor man's telemetry" — import a recorded track post-trip to reconstruct
  position data; worth documenting as a workflow even if not a first-class feature
