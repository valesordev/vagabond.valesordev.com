# US-005: Manage gear inventory

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Manage Rig |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want to add, edit, and remove gear items on my rig  
so that I have a master inventory I can later turn into trip packing lists.

## Acceptance criteria

1. Given a rig, when I create a gear item with name and optional category/weight/notes, then it appears under that rig’s gear list.
2. Given a gear item, when I update or delete it, then the list reflects the change.
3. Given a deleted rig, gear under that rig is not reachable (cascade or equivalent FK behavior).
4. List endpoint supports enough data to render an inventory screen without N+1 client guessing.

## ADR links

None specific for v0.1 inventory CRUD.

## Out of scope

- Trip-specific packing list generation (v0.2)
- Storage-zone tagging as a first-class planner feature (v0.2 polish)
- Weight rollups used for budget/calc UI (may store weight now; no packing UI required)

## Build notes

- API: `/api/v1/rigs/:rig_id/gear` in `rigs.rs`
- Crate: `crates/vagabond-gear`
- Tests: gear cases in `rig_api.rs`
