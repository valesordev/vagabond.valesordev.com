# Rig Profile — Brian's 4Runner

## Vehicle

| Spec | Value |
|------|-------|
| Make/Model | Toyota 4Runner (5th Gen) |
| Fuel tank | 23.0 gal |
| Est. range | ~375–420mi (mixed on/off-road) |
| Cargo length (seats folded) | ~47.2" |
| Cargo width (at floor) | ~43.8" |
| Cargo height | ~30.5" |
| Tow capacity | 5,000 lbs |
| Ground clearance | 9.6" (stock) |

### Sleep Setup
- **Current (field-ready)**: foam mat + sleeping bag rolled out directly on cargo floor — functional now
- **Future build**: modular sleeping platform with flat floor, under-platform storage, and LiFePO₄ integration
- Platform is a long-term improvement, not a blocker for trips

---

## Electrical System

### Power Stations
| Unit | Capacity | Max Output | Notes |
|------|----------|------------|-------|
| Jackery Explorer 1000 | 1,002 Wh | 1,000W AC | Primary for lights, devices, small appliances |
| Jackery Explorer 2000 | 2,160 Wh | 2,200W AC | Secondary / high-draw appliances, compressor fridge future |
| **Total** | **3,162 Wh** | | |

### Solar
| Unit | Wattage | Notes |
|------|---------|-------|
| EcoFlow SolarSaga 200W | 200W | Panel 1 |
| EcoFlow SolarSaga 200W | 200W | Panel 2 |
| **Total** | **400W peak** | ~200–300 Wh/day usable in desert conditions |

### Connectivity
- **Starlink** (portable/roam mode) — primary internet for remote work
- Raspberry Pi — onboard telemetry hub (Grafana Alloy agent)

### Power Planning Rules
- Desert day: assume 6hr peak sun → ~240–300Wh harvest from both panels
- Budget: Jackery 2000 for high-draw overnight; 1000 for day use
- Starlink draw: ~50–75W active — budget 300–450Wh/day for full-day connectivity
- Low-power mode: Pi + Alloy agent ~5–8W continuous

---

## Cooling & Food

| Item | Notes |
|------|-------|
| BougeRV 23qt 12V Compressor Cooler | Primary cold storage; ~35–45W draw |
| Coleman Classic 2-Burner Propane Stove | Camp cooking |
| Propane | 1lb canisters (backup) + 1lb adapter; resupply as needed |

*Note: BougeRV cooler draws from 12V vehicle circuit or Jackery — account for ~840–1,080Wh/day at continuous operation.*

---

## Cargo & Organization

### Storage Zones
1. **Rear cargo (under platform)** — heavy gear, water, electrical
2. **Rear cargo (on platform / above)** — sleep kit, clothes, daily access items
3. **Cargo carrier (roof/hitch)** — recovery gear, bulky items, spare tire equipment
4. **Cab (rear seats)** — cat supplies, fishing gear, day pack, first aid

### Current Cargo Carrier Config
- Hitch-mounted cargo carrier (in use / configuring)
- Roof rack: TBD

---

## Recovery & Safety
- First aid kit: optimized for desert dispersed camping (in progress)
- Recovery gear: TBD (build backlog)
- Navigation: **OsmAnd** (primary field app — FOSS, OSM data, offline GPX, open standards throughout); paper topo maps (build backlog)
- Communication: TBD — satellite communicator on build backlog (Garmin inReach or SPOT)

---

## Build Backlog (Prioritized)
1. Satellite communicator (inReach Mini 2 or SPOT Gen4)
2. Roof rack + mounting solution
3. Recovery kit (hi-lift jack, traction boards, tow straps)
4. Water filtration (Sawyer Squeeze or MSR TrailShot)
5. Skid plates (front diff, transfer case, fuel tank)
6. Navigation: paper topo maps for primary regions
7. Sleeping platform (modular, LiFePO₄ integration) — not blocking; foam mat works now

---

## Travel Companion
- **Cat** — travels on all camping trips; requires cat supplies in cab zone
