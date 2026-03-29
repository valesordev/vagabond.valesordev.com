# ADR-003: Grafana as Optional Observability Sidecar

**Status**: Accepted  
**Date**: 2026-03-20  
**Deciders**: Brian (initial)

## Context

Grafana + Alloy are part of Brian's existing homelab stack and a natural fit for:
- Visualising live telemetry (GPS track, speed, power stats) on a Grafana dashboard
- Routing RPi agent metrics through Alloy's OTLP pipeline

However, Grafana/Prometheus/Alloy add ~500MB of container images and meaningful memory
overhead to the Docker Compose stack. Community users deploying Vagabond on a Raspberry Pi
or a low-spec VPS shouldn't be forced to run the full observability suite just to plan a trip.

## Decision

Grafana, Prometheus, and Alloy are gated behind `--profile observability` in Docker Compose
(see ADR template: docker-compose profiles).

- The **core stack** (postgres, martin, vagabond-server, vagabond-web) has zero dependency
  on any Grafana service
- `vagabond-server` exposes a `/metrics` endpoint (Prometheus format) regardless of whether
  Grafana is running — scraping is optional
- Telemetry ingest path (`/api/v1/telemetry/ingest`) is always-on in the core stack;
  Alloy is just one of many possible agents that can POST to it

## Consequences

**Positive**
- Single-command `docker compose up` gives a lean, useful app
- Community deployments on constrained hardware are viable
- Grafana dashboards remain first-class for Brian's personal use via `--profile full`

**Negative**
- Live telemetry dashboards require the observability profile — not zero-config
- Two "views" of telemetry data: Grafana panels (Prometheus metrics) and the Vagabond
  map overlay (PostGIS points) — must be kept consistent
- Documentation must clearly explain which features require which profile

## Alternatives Considered

- **Always-on Grafana**: simpler docs, but unacceptable resource overhead for constrained deployments
- **Grafana Cloud only**: defeats the self-hosted, offline-first premise entirely
- **Build custom dashboards in the Next.js frontend**: viable long-term but duplicates
  effort; Grafana is already purpose-built for time-series viz and Brian already uses it
