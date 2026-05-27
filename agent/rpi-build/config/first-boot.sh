#!/usr/bin/env bash
# first-boot.sh — runs once on the Pi's first power-on.
# Injected via rc.local by the image builder. Marks completion with a sentinel file.
set -euo pipefail

SENTINEL=/var/lib/vagabond/first-boot-done
if [[ -f "$SENTINEL" ]]; then
    exit 0
fi

log() { echo "[vagabond-first-boot] $*" | tee -a /var/log/vagabond-first-boot.log; }

log "Starting first-boot provisioning..."

# ── Expand filesystem ─────────────────────────────────────────────────────────
log "Expanding root filesystem..."
raspi-config --expand-rootfs || true

# ── Set hostname ──────────────────────────────────────────────────────────────
hostnamectl set-hostname vagabond
sed -i 's/raspberrypi/vagabond/g' /etc/hosts

# ── Enable mDNS (vagabond.local) ──────────────────────────────────────────────
systemctl enable avahi-daemon
systemctl start avahi-daemon

# ── Wait for network ──────────────────────────────────────────────────────────
log "Waiting for network connectivity..."
for i in $(seq 1 30); do
    if curl -sf --max-time 5 https://registry-1.docker.io/v2/ > /dev/null 2>&1; then
        log "Network ready."
        break
    fi
    log "Attempt $i/30 — no connectivity yet, retrying in 10s..."
    sleep 10
done

# ── Pull and start Vagabond stack ─────────────────────────────────────────────
log "Pulling Vagabond Docker images..."
cd /opt/vagabond
docker compose -f docker-compose.pi.yml pull || {
    log "WARNING: image pull failed (no connectivity?). Will use cached images if available."
}

log "Starting Vagabond stack..."
docker compose -f docker-compose.pi.yml up -d

# ── Enable systemd service for subsequent boots ───────────────────────────────
systemctl enable vagabond.service

# ── Mark first boot complete ──────────────────────────────────────────────────
mkdir -p "$(dirname "$SENTINEL")"
touch "$SENTINEL"
log "First-boot provisioning complete. vagabond.local is available on the local network."
