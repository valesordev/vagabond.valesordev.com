# Vagabond

Self-hosted, offline-first trip planning and live tracking for overlanders, vanlifers, and
backcountry travelers.

**MIT License** · Rust + Next.js · PostGIS/MapLibre · Docker Compose

---

## Features (v0.1 MVP)

- Trip planning with waypoints, legs, and campsite tracking
- Gear inventory tied to your rig profile
- GPX route import → PostGIS storage
- Offline map via PMTiles (OSM base layer, no API keys required)
- Single-command Docker Compose deploy

**Roadmap**: live telemetry (v0.2), community campsite database (v0.3)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_ORG/vagabond.git && cd vagabond

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set POSTGRES_PASSWORD and JWT_SECRET

# 3. Launch core stack
docker compose up -d

# 4. Open
open http://localhost
```

Gateway routes:
- Web: `http://localhost/`
- API: `http://localhost/api/v1/...`
- Tiles: `http://localhost/tiles/...`
- Keycloak (auth profile): `http://localhost/auth/...`

### With auth (Keycloak)

```bash
docker compose --profile auth up -d
```

### Full stack (everything)

```bash
docker compose --profile full up -d
```

---

## Architecture

See [`docs/adr/`](docs/adr/) for Architecture Decision Records.

```
vagabond/
├── crates/
│   ├── vagabond-core/        # Domain types — zero infra deps
│   ├── vagabond-server/      # Axum HTTP API + migrations
│   ├── vagabond-gear/        # Gear inventory domain
│   └── vagabond-telemetry/   # OTLP ingest (v0.2)
├── web/
│   └── vagabond-web/         # Next.js frontend (MapLibre, PMTiles)
├── agent/
│   └── alloy-config/         # Grafana Alloy config for RPi agent
├── infra/
│   ├── keycloak/             # Realm export for local dev
│   ├── prometheus/           # Scrape config
│   └── grafana/              # Dashboard provisioning
└── docker-compose.yml
```

### Tech Stack

| Layer | Choice |
|-------|--------|
| Backend | Rust · Axum · SQLx |
| Database | PostgreSQL 16 + PostGIS 3.x |
| Tile server | Martin (MVT over PostGIS) |
| Frontend | Next.js 14 · MapLibre GL JS · Tailwind |
| Offline tiles | PMTiles (OSM base) |
| Auth | Keycloak (OIDC — any provider works) |
| Telemetry agent | Grafana Alloy on Raspberry Pi |

---

## Geo Standards

All formats are open (ADR-005):
**GPX** import/export · **GeoJSON** API wire format · **OSM** map data ·
**PMTiles** offline tiles · **MapLibre** renderer · **NMEA 0183** GPS input

---

## Development

### Prerequisites

- Rust 1.77+
- Node.js 20+
- Docker + Docker Compose v2

### Local dev (without Docker)

```bash
# Backend
cp .env.example .env  # set DATABASE_URL to a local PG instance
cargo build
cargo run -p vagabond-server

# Frontend
cd web/vagabond-web
npm install
npm run dev
```

### Running tests

```bash
cargo test                  # all workspace tests
cargo clippy -- -D warnings # lint (CI enforced)
cargo fmt --check           # format check (CI enforced)
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Open an issue before large PRs.
Write an ADR for any architectural decision before implementing it.

---

## License

MIT — see [LICENSE](LICENSE)
