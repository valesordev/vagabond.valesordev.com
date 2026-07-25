# Manual smoke: 4Runner rig + Mojave trip (Sawtooth → Mid Hills)

| Field | Value |
|-------|-------|
| Date | 2026-07-24 |
| Goal | Exercise current v0.1 UI against a clean DB: rig profile, gear inventory, trip plan, waypoints, campsite events |
| App URLs | Web: http://localhost · API: http://localhost/api/v1 · direct API: http://localhost:3001 |
| Auth | Keycloak profile is up — sign in via the web app (API expects a bearer JWT) |
| Dev login | Username `vagabond-dev` / password `vagabond-dev` (realm seed; see `infra/keycloak/README.md`) |
| DB prep | Domain tables truncated (`trips`, `rigs`, telemetry + cascades); `users` retained |

## Scenario summary

Build Brian’s 5th-gen 4Runner power/water/comms kit, then plan a two-stop Mojave desert trip:

1. **Sawtooth Canyon Campground** (BLM / “New Jack City”, south of Barstow) — **7 nights**
2. **Mid Hills Campground** (Mojave National Preserve) — **14 nights**

Suggested calendar (edit if you prefer different start day):

| Stop | Nights | Dates |
|------|--------|-------|
| Sawtooth Canyon | 7 | 2026-10-01 → 2026-10-08 |
| Mid Hills | 14 | 2026-10-08 → 2026-10-22 |
| **Trip window** | **21** | **2026-10-01 → 2026-10-22** |

Reference coordinates (map click targets):

| Place | Lat | Lon | Notes |
|-------|-----|-----|-------|
| Sawtooth Canyon CG | 34.6701 | -116.9839 | BLM; no potable water on site |
| Mid Hills CG | 35.1299 | -115.4358 | NPS; unpaved access; fee / reservation check before real travel |

---

## Preflight

- [ ] Stack is up: `docker compose ps` shows `vagabond-web`, `vagabond-server`, `vagabond-postgres`, `vagabond-gateway`, `keycloak` healthy/running
- [ ] Open http://localhost — landing / shell loads
- [ ] Sign in with Keycloak when prompted:
  - [ ] Click **Sign in with Keycloak**
  - [ ] Username: `vagabond-dev`
  - [ ] Password: `vagabond-dev`
  - [ ] Complete “update account information” if Keycloak forces it (email ok: `vagabond-dev@example.com`)
- [ ] Confirm empty state after login:
  - [ ] http://localhost/rig — no rig profile (prompt to create)
  - [ ] http://localhost/trips — no trips (or empty list)

Optional API sanity (needs a real JWT from the browser session — skip unless debugging):

```bash
# Health is on the server port, not the gateway root:
curl -s http://localhost:3001/health | jq .
# Authenticated calls require Authorization: Bearer <access_token>
```

---

## Part A — Create the 4Runner rig

1. Go to **Rig** (`/rig`).
2. Click **+ Create Rig Profile**.
3. Fill:

| Field | Value |
|-------|-------|
| Rig name | `4Runner — Desert Runner` |
| Make | `Toyota` |
| Model | `4Runner` |
| Year | `2020` |
| Fuel capacity (gal) | `23` |
| Battery capacity (Wh) | `3000` |
| Solar peak (W) | `400` |
| Notes | `Jackery 2000 + Jackery 1000; 2× SolarSaga 200W; Starlink Mini; BougeRV 22L cooler; 2× 5gal water.` |

4. Click **Create Rig**.
5. **Pass if:**
   - [ ] Rig detail view shows name / Toyota / 4Runner / 2020
   - [ ] Battery shows **3000** Wh and solar **400** W
   - [ ] Fuel shows **23** gal (range estimate may appear from ~17 mpg heuristic)

Notes:
- Rig-level battery/solar are **totals** for later budget math (US-006). Individual packs/panels are recorded as gear below.
- If your real pack is Jackery 2000 + 1000 nameplate ≈ **3162 Wh**, you can set battery to `3162` instead of `3000` — either is fine for this smoke.

---

## Part B — Add gear inventory

On the same rig page, use **Add gear** for each row. Categories are free text; use the values below so the inventory reads consistently.

| # | Name | Category | Storage zone | Weight (oz) | Notes |
|---|------|----------|--------------|-------------|-------|
| 1 | Jackery Explorer 2000 | Power | Rear Cargo | _(optional)_ | 2000 Wh portable power station |
| 2 | Jackery Explorer 1000 | Power | Rear Cargo | | 1000 Wh portable power station |
| 3 | Jackery SolarSaga 200W #1 | Power | Rooftop | | 200 W panel |
| 4 | Jackery SolarSaga 200W #2 | Power | Rooftop | | 200 W panel |
| 5 | Starlink Mini | Electronics | Cab | | Satellite uplink; mount TBD on roof rack |
| 6 | BougeRV 23qt / 22L cooler | Kitchen | Rear Cargo | | 12V compressor cooler (~40 W draw) |
| 7 | Water jerry can 5 gal #1 | Water | Rear Cargo | | Plastic jerry; dual-can desert carry |
| 8 | Water jerry can 5 gal #2 | Water | Rear Cargo | | Pair with #1 → 10 gal total |

For each item:

1. Click **Add gear**.
2. Fill name, category, storage zone, optional weight/notes.
3. Submit **Add gear**.
4. Confirm the row appears in the inventory table.

**Pass if:**

- [ ] All 8 gear rows are listed
- [ ] Categories group sensibly when scanning the table (Power / Electronics / Kitchen / Water)
- [ ] Storage zones: batteries + cooler + water in **Rear Cargo**; solar in **Rooftop**; Starlink in **Cab**
- [ ] Edit one item (e.g. add “primary pack” to Jackery 2000 notes) and confirm it persists after refresh
- [ ] Soft check: 2 batteries × capacities and 2×200 W solar match the rig totals you entered in Part A

---

## Part C — Create the Mojave trip

1. Go to **Trips** (`/trips`).
2. Open **New Trip** (or equivalent create control).
3. Fill:

| Field | Value |
|-------|-------|
| Name | `Mojave — Sawtooth + Mid Hills` |
| Start date | `2026-10-01` |
| End date | `2026-10-22` |
| Description | `7 nights Sawtooth Canyon (BLM), then 14 nights Mid Hills CG (MOJA). Carry 10 gal water; Starlink essential; no potable water at Sawtooth.` |

4. Click **Create Trip**.
5. **Pass if:**
   - [ ] Redirects to trip detail `/trips/<id>`
   - [ ] Name, dates, and description match
   - [ ] Map panel loads (default center near Mojave corridor is fine)
   - [ ] Waypoints list shows empty state

---

## Part D — Place campsite waypoints

On the trip detail page:

### D1 — Sawtooth Canyon (7 nights)

1. Click **+ Add Waypoint** — banner should say to click the map.
2. Pan/zoom to south of Barstow / Hwy 247 corridor.
3. Click near **34.6701, -116.9839**.
4. In the dialog:
   - Name: `Sawtooth Canyon Campground`
   - Notes: `BLM / New Jack City. 7 nights (Oct 1–8). First-come sites; no potable water; vault toilets.`
5. **Save waypoint**.
6. **Pass if:** marker + list row appear; coordinates line looks reasonable.

### D2 — Mid Hills (14 nights)

1. Click **+ Add Waypoint** again.
2. Pan east into Mojave National Preserve / Mid Hills area.
3. Click near **35.1299, -115.4358**.
4. Dialog:
   - Name: `Mid Hills Campground`
   - Notes: `NPS developed CG. 14 nights (Oct 8–22). Unpaved access; fee/reservation check before departure.`
5. **Save waypoint**.
6. **Pass if:**
   - [ ] Both waypoints listed
   - [ ] Clicking a row recenters/highlights the map as implemented
   - [ ] Optional: double-click rename still works; visited checkbox toggles without errors

Tip: if map click precision is hard, place approximate pins and rename — exact GPS can be refined later via GPX import.

---

## Part E — Log planned campsite events

Still on trip detail, under **Events** / **In the field**:

### E1 — Sawtooth stay

1. Open **Log Event** (or equivalent).
2. Type: **Campsite**.
3. Set:
   - Stay type: `established`
   - Nights: `7`
   - Notes: `Sawtooth Canyon — climbing canyon / New Jack City staging`
   - Occurred-at: `2026-10-01` (or first night timestamp if the dialog uses datetime)
4. Submit **Log Event**.
5. **Pass if:** event appears with campsite summary showing established stay / 7 nights.

### E2 — Mid Hills stay

1. Log another **Campsite** event:
   - Stay type: `established`
   - Nights: `14`
   - Notes: `Mid Hills CG — high desert work + day trips toward Hole-in-the-Wall`
   - Occurred-at: `2026-10-08`
2. **Pass if:** both campsite events listed; delete/recreate works if you need a redo.

Optional extras (nice-to-have for this smoke, not required):

- [ ] `trip_start` on 2026-10-01 with odometer note
- [ ] `water_fill` for 10 gal before leaving San Diego / at Baker
- [ ] One **field log** day entry under the field-log section (separate from events)

---

## Part F — End-to-end verification

Reload the browser (hard refresh) and confirm persistence:

- [ ] `/rig` still shows 4Runner + 3000 Wh / 400 W + all 8 gear items
- [ ] `/trips` lists `Mojave — Sawtooth + Mid Hills` with Oct 1–22 dates
- [ ] Trip detail still has 2 waypoints + 2 campsite events
- [ ] Sign out / sign back in once and confirm the same data still loads for your user

---

## Known limitations (do not fail the smoke for these)

- No packing-list generator yet (gear is rig inventory only).
- Trip events are journal/planning captures — they do not yet auto-drive itinerary UI or power budgets.
- Location catalog / agentic research (ADR-011) may not be wired into this flow; manual map pins are the expected path.
- Sawtooth is **BLM** (near Barstow), Mid Hills is **inside Mojave NP** — two different land managers; script still treats them as one continuous trip.

---

## Result log

| Section | Result (pass/fail) | Notes |
|---------|--------------------|-------|
| Preflight | | |
| A Rig create | | |
| B Gear inventory | | |
| C Trip create | | |
| D Waypoints | | |
| E Campsite events | | |
| F Persistence | | |

Tester: _______________  
Time spent: _______________  
Build / image notes: _______________
