# US-006: Define power system on rig

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Manage Rig |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to record battery capacity and solar wattage on my rig  
so that later budget calculations have real inputs — even if v0.1 only stores the profile.

## Acceptance criteria

1. Given a rig, when I set power-system fields (e.g. usable Wh capacity, solar peak watts, and/or named battery units consistent with schema), then GET rig returns those values.
2. Given updated power fields, when I change them, then values persist and round-trip through the API.
3. Schema is sufficient for ADR-007 pure functions to consume later without a breaking rename of core capacity fields (document field names in Build notes if already migrated).
4. No calculated multi-day power budget UI is required for this story.

## ADR links

- [ADR-007](../../adr/ADR-007-budget-calculation-engine.md) — calculation engine lives in `vagabond-core`; this story is schema/profile readiness only

## Out of scope

- Generating a trip power budget chart (v0.2)
- Jackery live SoC polling (ADR-010 / v0.4)
- Solar irradiance auto-tuning from NOAA

## Build notes

- Extend or use existing rig fields in migrations / `rigs` handlers — verify against current `0002_core_schema.sql` and rig DTOs
- Keep numbers as domain inputs; do not embed prediction logic in the HTTP layer
