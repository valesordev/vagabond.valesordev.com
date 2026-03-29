# ADR-005: Open Geo Standards Throughout

**Status**: Accepted  
**Date**: 2026-03-20  
**Deciders**: Brian

## Context

Brian has a hard preference for fully open standards — both on principle and for
practical reasons: proprietary geo tooling creates lock-in, often has licensing costs
that don't scale for an OSS project, and breaks the offline-first constraint when
cloud APIs are involved.

Every layer of the geo stack needs an explicit decision.

## Decision

The entire geo stack uses open standards exclusively:

| Layer | Standard | Notes |
|-------|----------|-------|
| Import/export | **GPX** (TopoGrafix open XML) | Primary format for tracks, routes, waypoints |
| API wire format | **GeoJSON** (RFC 7946) | All geo responses; lon/lat coordinate order enforced |
| Map data | **OSM** (ODbL) | No proprietary tile providers required |
| Offline tiles | **PMTiles** (Protomaps open spec) | See ADR-001 |
| Map renderer | **MapLibre GL JS** (BSD-2) | Fork of Mapbox GL JS; no Mapbox dependency |
| Vector tiles | **MVT / PBF** (open spec) | Served by Martin from PostGIS |
| GPS input | **NMEA 0183** | Standard GPS sentence protocol for agent hardware |
| Field navigation | **OsmAnd** (FOSS, OSM-based) | Recommended; GPX-native import/export |
| Storage CRS | **WGS84 (EPSG:4326)** | All PostGIS geometry columns; no reprojection at rest |

KML v2 import is a concession to format ubiquity (Caltopo, Google Earth exports) —
it is not a preferred format and Gaia GPS or other proprietary exports are out of scope.

## Consequences

**Positive**
- Zero licensing exposure for the community or for Brian personally
- GPX ↔ OsmAnd ↔ Caltopo workflow is fully round-trippable without data loss
- MapLibre means the frontend works without a Mapbox token — critical for offline
- NMEA 0183 support on the agent means any commodity USB GPS puck works

**Negative**
- OSM data quality varies by region; no fallback to commercial data sources
- MapLibre style ecosystem is smaller than Mapbox's; some advanced styles require porting
- NMEA parsing on the Raspberry Pi agent adds a small parsing layer over raw GPS output

## Alternatives Considered

- **Mapbox GL JS** — rejected; proprietary license, requires cloud token even for local use
- **Google Maps API** — rejected; cloud-only, violates self-hosted and open-standards constraints
- **KML as primary format** — rejected; GPX is the lingua franca of the overlanding
  and hiking tool ecosystem; KML is XML bloat with no additional value for our use case
