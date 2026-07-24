# ADR-016: Personal Field Navigation Stack Diverges from Project Recommendation

**Status**: Accepted
**Date**: 2026-05-21
**Deciders**: Brian
**Supersedes (partial)**: ADR-005 (Open Geo Standards Throughout) — only the field navigation recommendation row; all other open-standards decisions in ADR-005 remain in force.

> **Renumber note:** Originally filed as a duplicate ADR-013. Kept as ADR-016 so trip-event domain retains ADR-013.

## Context

ADR-005 designated **OsmAnd** as the recommended field navigation app for Vagabond users, on the grounds that it is FOSS, OSM-based, and GPX-native — consistent with the project's open-standards posture throughout the rest of the geo stack.

That recommendation still holds for the Vagabond open-source project and its community. For users who want a fully open stack from server to handheld, OsmAnd remains the right answer.

Brian's personal field navigation stack has diverged in practice. For the trip patterns he actually runs — extended road-trip transit, working drives with meeting blocks, kid-relocation trips on interstates, mixed dispersed/highway loops — Apple Maps (with offline regions) plus Gaia GPS (for backcountry/topo) has proven more operationally fluent than OsmAnd. Specifically:

- Apple Maps' offline regions and CarPlay integration win on long highway segments
- Gaia GPS's topo and satellite layers cover the dispersed-camping use case OsmAnd was filling
- Battery, sync, and "just works" behavior across iPhone and the in-cab environment matter more in practice than format purity for Brian's day-to-day

This is a personal-stack decision, not a project decision. ADR-005's recommendation to the *community* is unchanged.

## Decision

**Brian's personal field navigation stack is Apple Maps (primary, offline) + Gaia GPS (backcountry/topo, offline).** OsmAnd is not in active personal use.

The Vagabond project's recommended FOSS field nav remains OsmAnd. This is documented in:
- ADR-005 (unchanged for project recommendation)
- `vagabond/trips/data-sources.md` (community-facing — OsmAnd references remain)
- `vagabond/story-map-interview.md` (historical record — unchanged)

Brian's personal-config documents reflect the divergence:
- `CLAUDE.md` (life.solo7.media root) — Rig Quick Reference
- `vagabond/trips/equipment_inventory.md` — master rig inventory
- Claude project skill / `/vagabond-assistant` command — operational trip context

## Consequences

**Positive**
- Personal-config docs no longer fight with operational reality
- OSS project recommendation stays principled and useful to the community
- The skill stops re-suggesting OsmAnd in personal trip planning

**Negative**
- Vagabond's GPX export workflow must be tested against both OsmAnd (for the community) and Gaia GPS (for Brian). Gaia GPX import quirks become a Brian-specific QA path.
- Two-track documentation: project-facing vs. personal-config. Future contributors may be confused by the divergence if they read both sets of docs.

**Neutral**
- Vagabond's import/export remains GPX-first per ADR-005. Apple Maps does not export GPX; that's an acceptable gap because Apple Maps is used for highway transit, not the trip-recording use cases Vagabond serves.

## Alternatives Considered

- **Update ADR-005 in place**: rejected. ADRs are immutable historical records. The decision was correct at the time; the divergence is new context.
- **Strip OsmAnd from the project entirely and recommend Gaia GPS**: rejected. Gaia is proprietary; recommending it to the OSS community contradicts ADR-005's open-standards posture. The community deserves a FOSS recommendation even if Brian doesn't personally use it.
- **Drop the field-nav recommendation from the project entirely**: rejected. The OSS audience benefits from a concrete recommendation; "any GPX-compatible app" is too vague to be useful.
