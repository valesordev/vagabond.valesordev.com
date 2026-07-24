# Operator Runbooks

Operator-facing how-tos for running Vagabond. **Bodies are not written yet** — this index tracks planned runbooks so links from ADRs and user stories have a home.

## Planned runbooks

| Runbook | Purpose | Related |
|---------|---------|---------|
| PMTiles acquire & mount | Download a regional OSM PMTiles extract, mount/serve it for MapLibre range requests | ADR-001, US-007 |
| Compose profile matrix | What `default`, `auth`, `storage`, `observability`, `edge`, `full` enable | ADR-003, ADR-004, ADR-014, US-012 |
| BYO OIDC | Point the server at a non-Keycloak issuer | ADR-004 |
| Edge auth warning | Single-user `VAGABOND_DEV_AUTH` on Pi LAN — never internet-facing | ADR-014 |
| Pi flash & OTA | Build/flash image and update via compose pull / USB | ADR-015 |

## Product docs

Buildable feature work starts from [user stories](../user-stories/), not runbooks.
