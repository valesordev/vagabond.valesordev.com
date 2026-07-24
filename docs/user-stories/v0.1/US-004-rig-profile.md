# US-004: Create / update rig profile

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Manage Rig |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander  
I want a rig profile for my vehicle  
so that gear and power capacity hang off one place instead of scattered markdown.

## Acceptance criteria

1. Given I am authenticated, when I create a rig with a name and basic vehicle fields, then it appears in my rig list and GET-by-id returns those fields.
2. Given an existing rig, when I update its profile, then subsequent GET reflects the changes.
3. Given an existing rig, when I delete it, then it is removed and nested gear routes return not-found for that rig.
4. Responses use the standard API envelope.

## ADR links

None specific. Power capacity fields that feed later budget math are covered in US-006 / ADR-007.

## Out of scope

- Tow configuration modifiers (deferred in story map)
- Multi-rig fleet UX polish beyond CRUD
- Attaching media to the rig (v0.4)

## Build notes

- API: `/api/v1/rigs` CRUD in `crates/vagabond-server/src/routes/v1/rigs.rs`
- Tests: `crates/vagabond-server/tests/rig_api.rs`
- Domain: `vagabond-core` / `vagabond-gear` as applicable — verify current schema
