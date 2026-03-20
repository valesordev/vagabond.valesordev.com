# Vagabond — Project Standards

## License

**MIT License** — permissive, maximally community-friendly.

---

## Repository Conventions

### Branch Strategy
- `main` — always deployable; protected
- `dev` — integration branch; PRs merge here first
- `feat/<short-description>` — feature branches
- `fix/<short-description>` — bug fix branches
- `chore/<short-description>` — maintenance (deps, CI, docs)

### Commit Style (Conventional Commits)
```
feat(gear): add weight tracking to GearItem
fix(telemetry): handle WAL replay gap on reconnect
docs(adr): add ADR-006 for tile caching strategy
chore(deps): bump axum to 0.7.5
```

### PR Standards
- PRs must reference an issue or ADR if architectural
- Squash merge to `dev`; merge commit to `main`
- CI must pass (cargo test, cargo clippy, jest)
- At least one ADR for any decision that affects the domain model, API shape, or infrastructure

---

## ADR Template

File location: `docs/adr/ADR-NNN-short-title.md`

```markdown
# ADR-NNN: Title

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date**: YYYY-MM-DD
**Deciders**: Brian (initial); community PRs for v0.2+

## Context

What problem are we solving? What forces are at play?

## Decision

What did we decide to do?

## Consequences

What are the positive and negative outcomes of this decision?
What becomes easier? What becomes harder?

## Alternatives Considered

Brief list of rejected options and why.
```

---

## Rust Crate Conventions

### Workspace layout
All Rust crates live under `crates/`. Workspace `Cargo.toml` at root.

```toml
[workspace]
members = [
    "crates/vagabond-core",
    "crates/vagabond-server",
    "crates/vagabond-gear",
    "crates/vagabond-telemetry",
]
resolver = "2"
```

### Crate responsibilities
| Crate | Rule |
|-------|------|
| `vagabond-core` | Pure domain types and traits; zero infrastructure deps |
| `vagabond-server` | HTTP layer only; delegates to domain crates |
| `vagabond-gear` | Gear inventory domain logic; depends on core |
| `vagabond-telemetry` | Telemetry ingest + OTLP parsing; depends on core |

### Code standards
- `cargo clippy -- -D warnings` must pass (CI enforced)
- `cargo fmt` enforced via CI
- Error handling: `thiserror` for library crates; `anyhow` acceptable in binary crates
- No `unwrap()` in library code; use `?` and proper error types
- Async runtime: Tokio throughout

---

## Database Conventions

### Migrations
- Use `sqlx migrate` with versioned migration files
- Location: `crates/vagabond-server/migrations/`
- Format: `NNNN_description.sql` (e.g., `0001_create_trips.sql`)
- Never edit a committed migration — add a new one

### Schema conventions
- All tables: `snake_case`
- Primary keys: `id UUID DEFAULT gen_random_uuid()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ`
- Geometry columns: `geom geometry(Point, 4326)` — always WGS84 (EPSG:4326)
- Indexes: explicit `CREATE INDEX` on all geo columns using GIST

### Spatial query patterns
```sql
-- Distance query (meters)
ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)

-- Bounding box filter (fast, uses index)
WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)

-- Line from waypoints array
ST_MakeLine(ARRAY(SELECT geom FROM waypoints WHERE trip_id = $1 ORDER BY seq))
```

---

## API Conventions

### REST endpoint structure
```
/api/v1/trips              GET, POST
/api/v1/trips/:id          GET, PUT, DELETE
/api/v1/trips/:id/legs     GET, POST
/api/v1/gear               GET, POST
/api/v1/gear/:id           GET, PUT, DELETE
/api/v1/telemetry/ingest   POST (OTLP receiver)
/api/v1/tiles/:z/:x/:y     GET (proxies Martin or serves PMTiles)
```

### Response envelope
```json
{
  "data": { ... },
  "meta": { "total": 42, "page": 1 },
  "error": null
}
```

### Error format
```json
{
  "data": null,
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "Trip with id ... does not exist",
    "status": 404
  }
}
```

---

## Docker Compose Standards

### Service naming
- All services: lowercase kebab-case (`vagabond-server`, `vagabond-web`)
- No version pinning in service names

### Profiles
- Default (no profile): core services only (server, web, postgres, martin)
- `--profile auth`: adds Keycloak
- `--profile storage`: adds MinIO
- `--profile observability`: adds Grafana, Alloy, Prometheus
- `--profile full`: everything

### Environment
- Secrets via `.env` file (gitignored); `.env.example` committed
- No hardcoded credentials anywhere in committed code

---

## Contributing Guidelines (CONTRIBUTING.md summary)

1. Open an issue before large PRs
2. Follow branch + commit conventions above
3. Write an ADR for architectural decisions
4. Include tests: unit tests for domain logic; integration tests for API endpoints
5. Update `README.md` if adding a new service or config option
6. Be excellent to each other
