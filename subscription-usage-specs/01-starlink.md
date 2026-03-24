# Starlink — Usage Data Spec

**Last updated:** 2026-03-24
**Access method:** Local gRPC API (on-device, no auth required on LAN)
**Official API:** ❌ None — reverse-engineered protobuf, community-maintained
**Grafana integration:** ✅ Native Prometheus exporter + community dashboard

---

## Overview

Starlink exposes a gRPC API on the dish hardware at `192.168.100.1:9200`. This is the same
data source used by the Starlink app's Statistics page. The protobuf definitions are not
officially published by SpaceX but have been reverse-engineered and are stable enough for
production monitoring use. The community tool `sparky8512/starlink-grpc-tools` is the
canonical library for this API.

Since this is a **local LAN API**, data collection must happen from a device on the same
network as the dish — the Raspberry Pi running the Alloy agent is the natural collector
for field trips.

---

## API Access

| Property         | Value                                           |
|------------------|-------------------------------------------------|
| Host             | `192.168.100.1` (Starlink router LAN address)   |
| Port             | `9200`                                          |
| Protocol         | gRPC (HTTP/2 + protobuf)                        |
| Authentication   | None (LAN-only, no token required)              |
| Polling interval | Configurable; 60s default; data sampled at 15s  |

**Primary dependency:**

```
pip install starlink-grpc-tools
# or
docker pull sparky8512/starlink-grpc-tools
```

**Key gRPC methods:**

| Method                     | Description                                  |
|----------------------------|----------------------------------------------|
| `GetStatus`                | Dish state, GPS lock, uptime, alert flags    |
| `GetHistory`               | Ring buffer of 15s-interval metrics (3.6hrs) |
| `GetDishDiagnostics`       | Obstruction map, cell IDs                    |
| `GetNetworkInfo`           | IP addressing, topology                      |
| `GetLocation`              | GPS lat/lon if enabled                       |

---

## Available Metrics

### Connectivity / Performance

| Metric                       | Type    | Unit     | Notes                                    |
|------------------------------|---------|----------|------------------------------------------|
| `pop_ping_latency_ms`        | gauge   | ms       | Round-trip latency to PoP               |
| `downlink_throughput_bps`    | gauge   | bps      | Instantaneous download speed             |
| `uplink_throughput_bps`      | gauge   | bps      | Instantaneous upload speed               |
| `downlink_throughput_bytes`  | counter | bytes    | Cumulative — derive daily usage from delta |
| `uplink_throughput_bytes`    | counter | bytes    | Cumulative upload                        |
| `pop_ping_drop_rate`         | gauge   | ratio    | Packet loss (0.0–1.0)                    |
| `seconds_until_obstruction`  | gauge   | s        | Predicted obstruction time               |
| `fraction_obstructed`        | gauge   | ratio    | % of sky obstructed                      |
| `currently_obstructed`       | bool    | —        | Binary obstruction state                 |

### Health / Reliability

| Metric                        | Type    | Notes                                   |
|-------------------------------|---------|------------------------------------------|
| `state`                       | enum    | CONNECTED, SEARCHING, BOOTING, etc.     |
| `uptime_s`                    | counter | Seconds since last reboot                |
| `alerts_*`                    | bool    | motors_stuck, thermal_shutdown, etc.     |
| `bootcount`                   | counter | Number of reboots                        |
| `dish_software_version`       | string  | Firmware version                         |

### Value Analysis Dimensions

| Dimension           | Metric(s) to use                                              |
|---------------------|---------------------------------------------------------------|
| Feature utilization | `downlink_throughput_bytes` + `uplink_throughput_bytes` daily totals |
| Trend over time     | Rolling 30-day throughput avg; uptime % per day               |
| Productivity impact | % of trip hours connected (`state == CONNECTED`); latency CDF |

---

## Data Freshness

- History ring buffer covers ~3.6 hours at 15s resolution
- Collector must poll at least every 3.5 hours or data is lost
- Recommended: poll every 60s from the Raspberry Pi Alloy agent

---

## Grafana Integration

### Recommended approach: Prometheus exporter on Raspberry Pi

The `danopstech/starlink` project bundles a complete Prometheus exporter + Grafana
dashboard and is the lowest-friction path.

```yaml
# docker-compose snippet for Raspberry Pi
starlink-exporter:
  image: danopstech/starlink_exporter:latest
  ports:
    - "9817:9817"
  restart: unless-stopped
```

Prometheus scrapes `:9817/metrics` and pushes to Grafana Cloud via `remote_write`.

Pre-built Grafana dashboard: **ID 14661** on grafana.com/dashboards

### Alternative: Direct from Alloy

The existing Alloy config (`agent/alloy-config/config.alloy`) can be extended with a
`prometheus.scrape` component targeting the Starlink exporter sidecar. No additional
infrastructure needed if the exporter runs on the same Pi.

---

## Limitations & Gaps

- **No billing/cost API** — Starlink has no programmatic access to your monthly invoice
  or data cap consumption. Cost tracking must be manual (flat rate / per-GB overage from
  the Starlink customer portal, which has no API as of 2026-03).
- **LAN-only** — collection only possible when you're on the Starlink LAN. Not usable
  for retrospective analysis from the road unless the Pi is buffering.
- **No official API** — SpaceX could change the protobuf schema at any firmware update;
  monitor `sparky8512/starlink-grpc-tools` releases.
- **Mobile performance data** — GPS-correlated speed data is available if location is
  enabled; useful for route-level connectivity heatmaps via PostGIS.

---

## References

- [sparky8512/starlink-grpc-tools](https://github.com/sparky8512/starlink-grpc-tools) — canonical gRPC library
- [danopstech/starlink](https://github.com/danopstech/starlink) — Prometheus exporter
- [Sysdig: Monitor Starlink with Prometheus](https://www.sysdig.com/blog/monitor-starlink)
