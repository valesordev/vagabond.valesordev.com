# US-007: View offline map (PMTiles)

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Execute |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want a MapLibre map that loads OSM tiles from a local PMTiles archive  
so that I can see basemap context at camp without a commercial tile API or internet.

## Acceptance criteria

1. Given the core Compose stack is running with a mounted PMTiles archive, when I open the map view, then the basemap renders via MapLibre using HTTP range requests to the local PMTiles source (no Mapbox/Google tile keys).
2. Given the laptop/phone has no internet but can reach the Vagabond host on LAN (or localhost), when I pan/zoom within the archived region, then tiles continue to load.
3. Given the PMTiles file is missing or misconfigured, when I open the map, then the UI shows a clear failure state rather than hanging indefinitely.
4. Satellite imagery, if present, is optional and may require online — basemap must not depend on it.

## ADR links

- [ADR-001](../../adr/ADR-001-offline-first-pmtiles.md) — local PMTiles + MapLibre
- [ADR-005](../../adr/ADR-005-open-geo-standards.md) — OSM / MapLibre / open stack

## Out of scope

- Operator runbook body for acquiring regional extracts (see [runbooks stub](../../runbooks/README.md))
- Dynamic PostGIS MVT overlays beyond what is needed for waypoints (US-008)
- Full Pi edge packaging (ADR-014)

## Build notes

- Frontend: MapLibre in `web/vagabond-web/`
- Compose / nginx must serve the PMTiles file for range requests
- Document expected mount path in `.env.example` when implementing
