# ADR-001: Offline-First Map Tiles via PMTiles

**Status**: Accepted  
**Date**: 2026-03-20  
**Deciders**: Brian (initial)

## Context

Vagabond is built for use in remote areas — Mojave desert, Eastern Sierra, BLM backcountry —
where connectivity ranges from degraded to nonexistent. The map layer is central to every
feature (trip planning, live tracking, campsite lookup). If the map requires an outbound tile
request, the app is useless in the field.

Commercial tile providers (Mapbox, MapTiler) are online-only by default and introduce
proprietary lock-in. OSM-based alternatives need a self-hostable offline packaging strategy.

## Decision

Bundle a PMTiles archive (OSM base layer) directly in the Docker Compose stack.
MapLibre GL JS fetches tiles via HTTP range requests from this local archive — no outbound
tile requests required.

- **PMTiles spec** (Protomaps, open) — single-file archive, browser-streamable via byte-range
- **OSM data** (ODbL) — downloaded from Geofabrik or Protomaps daily builds
- **Martin** tile server remains in the stack for serving *dynamic* PostGIS layers
  (routes, waypoints, campsites) as MVT on top of the static PMTiles base

Online tile sources (MapTiler, Mapbox) may be configured as optional enrichment
(satellite imagery, etc.) but are never required.

## Consequences

**Positive**
- Full map functionality with zero connectivity
- No API keys, no per-tile billing, no vendor lock-in
- PMTiles HTTP range support means no tile server process needed for the base layer
- Aligns with ADR-005 (open geo standards throughout)

**Negative**
- PMTiles archive for a region (e.g. California) is ~2–8 GB; full CONUS is ~50 GB
  — operators must download and mount the appropriate extract
- Tile freshness is operator-managed (re-download from Protomaps builds periodically)
- Satellite/aerial imagery still requires an online source or a separate raster PMTiles bundle

## Alternatives Considered

- **Tile server (tegola, tileserver-gl)**: more ops complexity, doesn't solve the offline
  problem since tiles are still generated on-demand from PostGIS
- **Mapbox GL / MapTiler**: proprietary, online-only base tiles, SDK licensing restrictions
- **MBTiles + sqlite**: older format, not browser-streamable without a tile server proxy;
  PMTiles is the direct successor and is strictly better for this use case
