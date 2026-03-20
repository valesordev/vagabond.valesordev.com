# Contributing to Vagabond

Thanks for your interest. Vagabond is an early-stage project — contributions are welcome
but please read this first to avoid wasted effort on both sides.

---

## Before You Start

- **Open an issue** before submitting large PRs. Describe what you want to build and why.
- **Check the ADRs** in `docs/adr/` — don't propose changes that contradict accepted decisions
  without first proposing a superseding ADR.
- **Check the milestone** — if a feature is tagged for v0.3, don't submit it as a v0.1 PR.

---

## Branch & Commit Conventions

```
main        always deployable; protected
dev         integration branch; PRs merge here first
feat/<name> feature branches
fix/<name>  bug fixes
chore/<name> maintenance (deps, CI, docs)
```

Commit style (Conventional Commits):

```
feat(gear): add weight tracking to GearItem
fix(telemetry): handle WAL replay gap on reconnect
docs(adr): add ADR-006 for tile caching strategy
chore(deps): bump axum to 0.7.5
```

---

## Pull Request Standards

- Reference an issue or ADR in the PR description
- Squash-merge to `dev`; merge commit to `main`
- CI must pass: `cargo test`, `cargo clippy -- -D warnings`, `npm run type-check`
- Any decision affecting the domain model, API shape, or infrastructure needs an ADR

---

## Code Standards

### Rust

- `cargo clippy -- -D warnings` must pass — no warnings allowed
- `cargo fmt` enforced
- `thiserror` in library crates; `anyhow` acceptable in binary crates
- No `unwrap()` in library code — use `?` and typed errors
- All spatial queries go through PostGIS `ST_` functions — never compute geo in Rust

### TypeScript / Next.js

- `npm run type-check` must pass
- `npm run lint` must pass
- No `any` types without a comment explaining why

### Database

- Never edit a committed migration — add a new one
- All geometry columns: `geometry(Type, 4326)` — always WGS84
- Explicit `CREATE INDEX ... USING GIST` on all geo columns

---

## ADR Template

New ADRs go in `docs/adr/ADR-NNN-short-title.md`:

```markdown
# ADR-NNN: Title

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date**: YYYY-MM-DD
**Deciders**: ...

## Context
## Decision
## Consequences
## Alternatives Considered
```

---

## Be Excellent to Each Other

Vagabond is a small project. Keep discussions technical and constructive.
