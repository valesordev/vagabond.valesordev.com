# User Stories

Buildable product stories for Vagabond. Each story is a markdown file with a stable ID, acceptance criteria, and ADR links so implementation and review share one source of truth.

## Releases

| Release | Theme | Status |
|---------|-------|--------|
| [v0.1](v0.1/) | Better Markdown — switch point off markdown + OsmAnd | **Active** — stories written here |
| v0.2+ | Trip Planner, Informed Traveler, Connected Rig | Still in parent `story-map-interview.md` until promoted |

## Backbone activities

Stories tag one of these activities (from the product story map):

1. **Discover** — research sites (mostly v0.2+)
2. **Plan** — build a trip
3. **Manage Rig** — gear and vehicle
4. **Execute** — in the field
5. **Log & Review** — notes and actuals
6. **Stay Informed** — alerts (v0.3+)
7. **Infra** — deploy and auth (supporting)

## Story file template

```markdown
# US-NNN: Title

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Plan \| Manage Rig \| Execute \| Log \| Infra |
| Persona | Solo overlander / remote worker |

## Story

As a …  
I want …  
so that …

## Acceptance criteria

1. Given … When … Then …
2. …

## ADR links

- [ADR-00N](../../adr/ADR-00N-....md) — why it constrains this story

## Out of scope

- …

## Build notes

- Suggested crates / routes / UI surfaces (verify against current code)
```

## Working agreements

- One story = one mergeable slice of value with testable AC.
- Link only ADRs that actually constrain the story.
- Do not expand a story into later-release features; put those under Out of scope.
- Prefer Given/When/Then or numbered checklists that map to API/e2e tests.
