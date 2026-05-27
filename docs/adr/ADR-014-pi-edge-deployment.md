# ADR-014: Raspberry Pi Edge Deployment

**Status**: Accepted
**Date**: 2026-05-11
**Deciders**: Brian (initial)

## Context

The primary deployment model through ADR-008 assumed Brian's home server as the Vagabond
host, accessed over Starlink LAN at camp. This is correct for most trips but breaks the
offline-first guarantee in a meaningful way: if the home server is unreachable (Starlink
outage, ISP issue, extended backcountry stay), Vagabond is unavailable.

The Raspberry Pi already travels in the rig as a telemetry agent. Extending it to run the
full Vagabond stack eliminates the home-server dependency and makes the rig genuinely
self-contained. In this model:

- The Pi IS the Vagabond server
- Phone and laptop connect to the Pi over the rig's local network (Pi hotspot or shared
  Starlink LAN)
- Starlink, when available, provides internet access — but Vagabond itself does not require it
- The Pi syncs data out (to a cloud backup or home server) opportunistically when connectivity
  is present; this is deferred to a future release

Constraints:
- Pi hardware is arm64 (Pi 4 or Pi 5 assumed; arm32 not supported)
- Pi runs headless — no monitor, keyboard, or display attached in the rig
- All services must start automatically on boot without user intervention
- The stack must fit within Pi hardware limits: aim for ≤2 GB RAM at steady state
- Keycloak is too heavyweight for edge deployment — single-user mode required
- The build and provisioning workflow must be executable from within the rig (laptop +
  Docker) — see ADR-015

## Decision

### New compose profile: `edge`

A new `--profile edge` targets the Pi. It includes only the services the Pi needs and
explicitly excludes Keycloak, MinIO, and the heavy observability stack.

**Edge profile services:**

| Service | Image | Notes |
|---------|-------|-------|
| `postgres` | `postgis/postgis:16-3.4` | PostGIS — same image, runs on arm64 |
| `vagabond-server` | `ghcr.io/solo-seven/vagabond-server:latest` | arm64 build |
| `martin` | `ghcr.io/maplibre/martin:latest` | arm64; MVT tiles from PostGIS |
| `vagabond-web` | `ghcr.io/solo-seven/vagabond-web:latest` | arm64; optional but included |
| `alloy` | `grafana/alloy:latest` | GPS + sensor telemetry ingest |
| `vagabond-gateway` | `nginx:alpine` | routes web, API, tiles, alloy on port 80 |

**Excluded from edge:** `keycloak`, `minio`, `prometheus`, `postgres-exporter`, `cadvisor`,
`node-exporter`, `grafana`

### Authentication in edge mode

Keycloak is excluded. In edge mode, `VAGABOND_DEV_AUTH=true` is set — the server accepts a
`X-Vagabond-User-Id` header for single-user local use. This is a dev-auth bypass that was
already built into the server for local development; it is repurposed here as the permanent
auth mechanism for the personal edge deployment.

This is acceptable because:
- The Pi is on a private local network (not internet-exposed)
- The user is always the same person
- Full OIDC auth (Keycloak) is still available in the `default`/`full` profiles on the home
  server where multi-user or internet-facing deployment may be needed

`VAGABOND_DEV_USER_ID` is set to Brian's canonical user UUID at provisioning time and does
not change across flashes or rebuilds.

### Networking modes

The Pi supports two network modes, configured at build time and switchable via env var:

**Client mode** (default): Pi connects to an upstream WiFi network (Starlink hotspot or
phone hotspot). This is the normal in-field mode. DHCP assigns the Pi an IP; the phone/
laptop accesses Vagabond at `http://vagabond.local` (mDNS/Avahi) or at the Pi's IP.

**Hotspot mode** (via `VAGABOND_WIFI_MODE=hotspot`): Pi creates its own WiFi AP
(`vagabond-local`, configurable SSID/passphrase). Phone and laptop connect to the Pi
directly. Used when no upstream WiFi is available and the Pi must be the network hub.

Both modes are configured at OS level (NetworkManager), not in Docker Compose.

### Alloy agent on edge

In edge mode, Alloy runs as a container and points `VAGABOND_INGEST_URL` at the local
`vagabond-server` (same Docker network, `http://vagabond-server:3001/api/v1/telemetry/ingest`).
The WAL buffer handles GPS capture when the server is temporarily unavailable during boot.

GPS source is configured via `VAGABOND_GPS_SOURCE`:
- `serial:/dev/ttyUSB0` — USB GPS puck
- `gpsd:localhost:2947` — gpsd socket (for devices that use gpsd as a GPS daemon)
- `nmea-bt` — NMEA over Bluetooth (phone as GPS source; deferred to v0.3)

### Data persistence

Postgres data is stored in a named Docker volume. This volume persists across container
restarts and compose upgrades. A backup script (`vagabond-backup.sh`) dumps the database to
a `.sql.gz` file on a USB drive or second path — run manually or via cron. Full sync to home
server or cloud is deferred.

### Crate placement

No new crates. This is a deployment configuration change:
- New `docker-compose.pi.yml` in the repo root (edge-specific overrides)
- New `agent/rpi-build/` directory for the image builder (see ADR-015)
- Updated `infra/` with edge-specific nginx config and alloy config

## Consequences

**Positive**
- Rig is fully self-contained — Vagabond runs with zero internet dependency
- Starlink becomes an enhancement (internet, Grafana Cloud sync) not a requirement
- Single-user edge mode is simpler than Keycloak for personal use
- The Pi's Alloy agent and the Pi's Vagabond server share a local Docker network — no
  OTLP forwarding over the internet required
- Data stays in the rig — no dependency on home infrastructure for field logging

**Negative**
- Two deployment targets (home server, Pi edge) require maintaining two compose
  configurations in sync — mitigated by shared services and profile gating
- `VAGABOND_DEV_AUTH=true` bypasses JWT validation — this is acceptable for a private
  local network, but must never be used on internet-facing deployments; documented clearly
- arm64 Docker images must be built and published alongside amd64 images (multi-arch
  builds via buildx); adds CI build time
- Pi is a single point of failure in the rig — no redundancy. Mitigation: keep a recent
  Postgres dump on a USB drive; the home server holds a copy of all pre-departure data

**Offline-first**: Fully satisfied. All services run locally; no outbound connectivity
required for any Vagabond operation.

**Grafana/Alloy seam**: Alloy runs as a sidecar on the Pi's Docker network, forwarding
to the local `vagabond-server`. The Grafana Cloud push (remote_write) is an optional
Alloy pipeline component that activates only when connectivity is present — it does not
block local telemetry ingest.

## Alternatives Considered

- **Home server only, accessed over Starlink**: the existing model. Fails when Starlink is
  down or in areas with no connectivity. Violates the "fully off-grid" requirement. Rejected
  as the sole deployment model; retained as an option alongside edge deployment.

- **Separate Pi-only repo**: simpler per-target but splits the codebase across two repos,
  creating drift. Compose profiles within the same repo are the right pattern. Rejected.

- **balenaOS for fleet management**: correct for multi-device fleets; overkill for one Pi.
  Adds a hard dependency on Balena Cloud for device management. Rejected.

- **Keycloak on Pi**: tested; consumes ~600 MB RAM at idle, leaving insufficient headroom
  for Postgres + server + Martin. Single-user dev-auth bypass is the pragmatic choice at
  this scale. Rejected for edge profile.
