# ADR-006: Location Catalog Domain Structure

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Brian (initial)

## Context

The story map surfaced a first-class "Location" concept that does not exist in the current
domain model. A Location is a campsite, trailhead, POI, or waypoint of interest that exists
independently of any specific trip — it is part of a persistent catalog that grows over time
through imports, scraping, and manual entry.

Locations have distinct characteristics from trip-scoped entities:
- They persist across trips (a campsite is the same campsite on every visit)
- They have a jurisdiction (BLM, NPS, USFS, private) that affects rules and access
- They accumulate user notes, conditions reports, and eventually media
- They are the input to trip planning, not an output of it
- Their import pipeline (GPX/KML ingest, public data scraping) is a separate concern from
  trip CRUD

The question is where this domain lives in the crate structure and how it relates to
`vagabond-core`, `vagabond-server`, and the future agentic enrichment pipeline (ADR-011).

## Decision

**Split the Location domain across two layers:**

1. **`vagabond-core`** — owns the `Location` type and related value objects
   (`Jurisdiction`, `LocationType`, `LocationNote`). These are pure domain types with no
   infra dependencies. Trips reference Locations by ID; the `vagabond-core` domain model
   owns the association.

2. **New crate: `vagabond-locations`** — owns the import and enrichment pipeline:
   GPX/KML parsing, public data ingest adapters, and (eventually) the agentic enrichment
   interface. This crate depends on `vagabond-core` for types but is otherwise independent
   of `vagabond-server`.

HTTP handlers for the Location catalog API live in `vagabond-server` alongside the existing
trip and gear handlers. No new binary is needed.

**Core domain entities (defined in `vagabond-core`):**

```
Location
  ├── id: Uuid
  ├── name: String
  ├── geometry: Point (PostGIS)
  ├── location_type: LocationType  (Campsite | Trailhead | WaterSource | POI | Hazard)
  ├── jurisdiction: Jurisdiction   (BLM | NPS | USFS | StateParks | Private | Unknown)
  ├── land_unit: Option<String>    (e.g. "Mojave National Preserve")
  ├── notes: Vec<LocationNote>
  ├── source: LocationSource       (Manual | GpxImport | KmlImport | Scraped)
  └── user_id: Uuid                (owner; multi-user later)

LocationNote
  ├── id: Uuid
  ├── location_id: Uuid
  ├── body: String
  ├── conditions_date: Option<Date>  (when conditions were observed, not when note was written)
  └── created_at: DateTime<Utc>
```

**Import pipeline (defined in `vagabond-locations`):**

```
GpxImporter     → parses GPX waypoints → Vec<Location>
KmlImporter     → parses KML placemarks → Vec<Location>
LocationRepository → persistence layer (PostGIS queries)
```

## Consequences

**Positive**
- Location catalog is independently evolvable — import pipeline changes don't touch trip logic
- `vagabond-core` Location type is available to all crates without pulling in the import deps
- Clean seam for the v0.4 agentic enrichment pipeline: it targets `vagabond-locations` only
- Jurisdiction and land management metadata enables future permit/rule lookups

**Negative**
- One more crate to maintain; workspace grows from 4 to 5 crates
- Trips referencing Location IDs creates a cross-domain FK — must handle the case where a
  location is deleted that is referenced by a trip (soft delete or restrict)

## Alternatives Considered

- **Fold Location into `vagabond-core` entirely**: simpler initially, but entangles the import
  pipeline (file parsing, HTTP scraping) with the core domain crate, which has a "zero infra
  deps" constraint
- **Fold Location into `vagabond-server`**: makes Location catalog a server-only concern and
  prevents reuse in a future CLI or agent; rejected
- **Keep Locations as trip-scoped waypoints only**: the story map explicitly identified the
  catalog as a persistent, cross-trip asset — collapsing it back into waypoints loses that
