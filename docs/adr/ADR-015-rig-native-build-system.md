# ADR-015: Rig-Native Build System

**Status**: Accepted
**Date**: 2026-05-11
**Deciders**: Brian (initial)

## Context

ADR-014 establishes the Pi as a full-stack edge server. To get that stack onto the Pi, and
to keep it updated during extended trips, we need a build and provisioning system with two
distinct capabilities:

1. **Initial image build**: produce a flashable `.img` from scratch — RPi OS Lite base,
   Docker pre-installed, Vagabond compose file embedded, first-boot provisioning. The result
   can be flashed to a new SD card with standard tools (Raspberry Pi Imager, `dd`).

2. **In-field OTA update**: once the Pi is running, update services without reflashing.
   This must work from within the rig — from the laptop on the local rig network, or
   potentially from the Pi itself pulling new images.

A key constraint from the user: the system must eventually be buildable and deployable from
the rig, not from a home workstation. Extended trips mean weeks without access to a desk setup.

### Forces

- Reproducible: the same build inputs produce the same image every time
- No cloud lock-in: the build does not require Balena, AWS, or any external build service
- Runs in Docker: any machine with Docker can build the image, including a laptop in the rig
- Pi-native ARM64: cross-compilation or QEMU emulation as needed
- OTA path must not require SD card reflash for routine updates

## Decision

### Two-tier architecture

**Tier 1 — Image builder** (`agent/rpi-build/`): a Docker-based tool that produces a
flashable SD card image. Run on a laptop (rig or home). Output: `vagabond-pi.img`.

**Tier 2 — OTA updater**: Docker Compose pull + restart, executed on the Pi or triggered
remotely over SSH from the laptop. No image rebuild required for service updates.

---

### Tier 1: Image builder

Located at `agent/rpi-build/`. Structure:

```
agent/rpi-build/
├── Dockerfile          # the builder container
├── Makefile            # targets: build, flash, clean
├── config/
│   ├── first-boot.sh   # runs on first Pi boot: hostname, SSH key, wifi, docker-compose up
│   ├── vagabond.service  # systemd unit: docker compose up on every boot
│   └── wpa_supplicant-vagabond.conf.template  # wifi credential template
└── README.md
```

**Build process inside the Dockerfile:**

1. Pull a pinned Raspberry Pi OS Lite (arm64) image from the RPi Foundation downloads
2. Mount it with `kpartx` / `losetup`
3. Inject into the image:
   - Docker + Docker Compose (via `apt` inside a `chroot` with QEMU binfmt_misc)
   - `docker-compose.pi.yml` + `.env.pi` (rendered from template at build time)
   - `vagabond.service` systemd unit
   - `first-boot.sh` run-once script (via `rc.local` or a dedicated systemd oneshot)
   - SSH public key for passwordless laptop access
   - Avahi/mDNS configured for `vagabond.local`
4. Unmount and compress to `vagabond-pi.img.xz`

**Makefile targets:**

```makefile
build        # build the builder Docker image + produce vagabond-pi.img
flash DISK=  # dd the .img to the specified device (e.g. make flash DISK=/dev/sdb)
clean        # remove output artifacts
```

**Variables passed at build time** (via `--build-arg` or `.env.builder`):

| Var | Purpose |
|-----|---------|
| `VAGABOND_SSH_PUBKEY` | SSH public key to inject (defaults to `~/.ssh/id_ed25519.pub`) |
| `POSTGRES_PASSWORD` | Postgres password for the Pi stack |
| `VAGABOND_DEV_USER_ID` | Canonical user UUID (persists across flashes) |
| `VAGABOND_WIFI_SSID` / `VAGABOND_WIFI_PSK` | Pre-configured upstream WiFi (optional) |

Secrets are never committed. `.env.builder` is gitignored; `.env.builder.example` is committed.

**First-boot sequence** (once, on first Pi power-on):

1. Set hostname to `vagabond`
2. Expand filesystem to fill SD card
3. `docker compose -f /opt/vagabond/docker-compose.pi.yml pull`
4. `docker compose -f /opt/vagabond/docker-compose.pi.yml up -d`
5. `systemctl enable vagabond.service` (so compose starts on every subsequent boot)
6. Mark first-boot done (sentinel file)

After first boot, `vagabond.service` handles startup on every subsequent power cycle.

---

### Tier 2: OTA update

From the laptop in the rig (or from the Pi itself):

```bash
# On the Pi (via SSH or direct):
cd /opt/vagabond
git pull                          # pull latest compose file + config
docker compose -f docker-compose.pi.yml pull   # pull updated images
docker compose -f docker-compose.pi.yml up -d  # restart changed services
```

Vagabond arm64 Docker images are published to GHCR (`ghcr.io/solo-seven/vagabond-*`) via
CI multi-arch builds (`docker buildx build --platform linux/arm64,linux/amd64`). The Pi
pulls them when connectivity is available (Starlink or phone hotspot).

**Offline update path** (no internet in the rig): transfer images via USB drive:

```bash
# On a connected machine: export
docker save ghcr.io/solo-seven/vagabond-server:latest | gzip > vagabond-server.tar.gz

# On the Pi: import
docker load < vagabond-server.tar.gz
docker compose -f docker-compose.pi.yml up -d vagabond-server
```

This is documented as a runbook step, not automated in v0.1.

---

### Where it lives in the repo

```
agent/
├── alloy-config/
│   └── config.alloy                 (existing)
└── rpi-build/
    ├── Dockerfile
    ├── Makefile
    ├── .env.builder.example
    ├── config/
    │   ├── first-boot.sh
    │   ├── vagabond.service
    │   └── wpa_supplicant-vagabond.conf.template
    └── README.md
```

`docker-compose.pi.yml` lives at the repo root (alongside `docker-compose.yml`) since it
is a Compose file, not a build artifact.

## Consequences

**Positive**
- Fully reproducible: same inputs → same image every time
- No external build service: runs on any Docker host, including the rig laptop
- OTA path is simple: `git pull` + `docker compose pull` + `up -d`
- Offline update via USB image export is a well-understood escape hatch
- `VAGABOND_DEV_USER_ID` persists across flashes — trip data stays consistent
- First-boot provisioning is idempotent (sentinel file guards re-execution)

**Negative**
- QEMU-based `chroot` for arm64 on x86 adds build time (~10–15 min on a modern laptop)
- Pi 4/5 multi-arch images add CI build time and GHCR storage
- First-boot requires internet to pull Docker images — `first-boot.sh` should handle
  the case where connectivity is not yet available (retry loop, degrade gracefully)
- USB offline update path is documented but manual — automation deferred

**Offline-first**: The image is self-contained enough to boot and run the already-pulled
Docker images. First-boot pulls images; subsequent boots use local copies. OTA requires
connectivity but is never blocking — the running stack stays up until an update is applied.

## Alternatives Considered

- **pi-gen** (official RPi image builder): more mature but complex dependency tree; difficult
  to run in a container without privileged mode. Our custom builder achieves the same output
  with a simpler pipeline. Reconsidered if maintenance burden grows.

- **Ansible playbook over SSH**: provisions a stock RPi OS install in-place, no image build.
  Simpler but requires the Pi to already be booted and network-accessible before provisioning.
  Breaks the "flash SD and power on" workflow. Rejected for initial provisioning; acceptable
  as a supplement for config drift repair.

- **balenaOS + Balena Cloud**: built exactly for this use case; handles OTA, fleet
  management, and remote monitoring out of the box. Adds a hard dependency on Balena Cloud
  for device management — conflicts with self-hosted constraint. Rejected.

- **NixOS on Pi**: reproducible by design, declarative config. Significant learning curve;
  not aligned with the Docker Compose deployment model used everywhere else in Vagabond.
  Interesting long-term; rejected for v0.1.
