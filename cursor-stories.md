# Vagabond — Design Migration: Cursor Agent Stories

Prompts for Cursor agents to migrate the app UI from scratch to match the prototype design.

## Context

**Design prototype:** `../design/vagabond-lifestyle-manager/project/`
- `styles.css` — design system tokens, all component CSS classes
- `app.jsx` — shell, sidebar, connectivity banner, nav icons
- `screens-1.jsx` — Dashboard, Trip Planner (full hero), primitive components
- `screens-2.jsx` — Trip Detail, Budget (visual + spreadsheet), Settings
- `screens-3.jsx` — Location Catalog, Location Detail, Field Log, Post-trip Reconciliation
- `screens-4.jsx` — Real-time Monitor

**App:** `web/vagabond-web/` (Next.js 14 App Router, TypeScript, shadcn/ui, Tailwind, MapLibre, Zustand, React Query)

**Key conventions:**
- Design-spec CSS lives in `web/vagabond-web/src/styles/vagabond-app.css` (already partially ported). Use these CSS classes (`.card`, `.btn-sm`, `.pill`, `.micro`, `.kpi`, etc.) for elements that match the prototype. Use Tailwind for layout spacing and positioning.
- Mock data: `web/vagabond-web/src/lib/mock/vagabond-data.ts` — the app's equivalent of `window.VagabondData`. Import from here when API hooks don't exist yet.
- Shared primitive components: `web/vagabond-web/src/features/lifestyle/primitives.tsx`
- Most screen component files already exist as stubs — implement/replace their contents.
- All TypeScript: no `any`, explicit prop types.

---

## Story 1 — Design System Foundation

**Goal:** Ensure the app's CSS and primitive components fully match the design system.

**Design source:** `../design/vagabond-lifestyle-manager/project/styles.css` (all), `app.jsx` (ConnectivityBanner, NavIcon, SimpleTopbar).

### Part A — `web/vagabond-web/src/styles/vagabond-app.css`

Audit and update to include every CSS class from `styles.css`. Pay particular attention to:

- **Shell:** `.app` (grid layout), `.sidebar`, `.brand`, `.brand-mark`, `.brand-name`, `.brand-sub`, `.nav`, `.nav-section`, `.nav-item` (+ active state), `.nav-count`, `.nav-icon`, `.sidebar-footer`
- **Topbar:** `.topbar`, `.topbar-left`, `.topbar-right`, `.topbar-crumb`, `.topbar-title`
- **Connectivity banner:** `.conn-banner`, `.conn-banner.starlink`, `.conn-banner.offline`
- **Layout:** `.page`, `.page-narrow`, `.main`, `.dash-grid`
- **Cards:** `.card`, `.card-tinted`, `.card-accent`
- **Buttons:** `.btn-sm`, `.btn-sm.ghost`, `.btn-sm.sage`
- **Status:** `.pill`, `.pill.ok`, `.pill.warn`, `.pill.err`, `.pill.neutral`, `.dot` (colored inline dot)
- **KPI:** `.kpi-row`, `.kpi`, `.kpi-label`, `.kpi-value`, `.unit`, `.kpi-foot`, `.kpi.accent`
- **Typography:** `.micro` (uppercase tracking label), `.mono` (monospace span), `.lede`
- **Category bar:** `.cat-stack`, `.cat-stack-seg`, `.cat-list`, `.cat-swatch`, `.cat-label`, `.cat-amt`, `.cat-delta` + per-key color classes (`.cat-fuel`, `.cat-food`, `.cat-camp`, etc.)
- **Segment control:** `.segment` + active state
- **Divider:** `.divider`
- **Density vars:** `[data-density="compact"]` overrides

### Part B — `web/vagabond-web/src/features/lifestyle/primitives.tsx`

Implement or update these shared components (they may exist as stubs):

```ts
KPI(props: { label: string; value: string | number; unit?: string; foot?: string; accent?: boolean })
SectionHead(props: { title: string; right?: string })
SimpleTopbar(props: { crumb: string; title: string; children?: React.ReactNode })
CategoryStack(props: { categories: BudgetCategory[]; total: number; compact?: boolean; showActual?: boolean })
StatusDot(props: { status: "ok" | "warn" | "err" | "off" })
```

`BudgetCategory` type: `{ key: string; label: string; planned: number; actual?: number; note?: string }`.

`CategoryStack` renders a proportional stacked bar div (`.cat-stack`) then a `ul.cat-list` with swatch, label, amount, and optional delta.

### Part C — Shell components

**`web/vagabond-web/src/components/shell/ConnectivityBanner.tsx`**

Translate exactly from `app.jsx ConnectivityBanner`. Props: `connectivity: "online" | "starlink" | "offline"`. Returns `null` for online. Starlink banner: amber background, "Starlink LAN only." text, "uplink: standby" mono tag. Offline banner: red background, ADR-008 offline note, "1 log queued · 4 photos pending" mono tag.

**`web/vagabond-web/src/components/shell/NavIcon.tsx`**

All 9 nav icons from `app.jsx NavIcon` as SVG: dashboard, trip, planner, budget, location, log, monitor, reconcile, settings. Export as `NavIcon({ name: NavIconName })`.

---

## Story 2 — App Shell / Sidebar Navigation

**Goal:** Implement the full sidebar navigation and lifestyle layout shell.

**Design source:** `../design/vagabond-lifestyle-manager/project/app.jsx` (Sidebar, App).

**Files to edit:**
- `web/vagabond-web/src/components/AppShell.tsx`
- `web/vagabond-web/src/app/lifestyle/layout.tsx` (create if missing)

### Sidebar

Render exactly per design:

1. **Brand area:** 34×34px bordered box with "V" letter + "Vagabond" / "Lifestyle manager" text stacked.
2. **Nav sections** with `div.nav-section` labels:
   - **Trip:** Dashboard → `/lifestyle`, Trip planner (badge: `GA`) → `/lifestyle/planner`, Trip detail → `/lifestyle/trip-detail`, Budgets → `/lifestyle/budget`
   - **In field:** Real-time monitor (badge: `live`) → `/lifestyle/monitor`, Field log → `/lifestyle/field-log`, Reconcile (badge: `1`) → `/lifestyle/reconcile`
   - **Catalog:** Locations (badge: `142`) → `/lifestyle/catalog`
   - **System:** Settings → `/lifestyle/settings`
3. Active state via `usePathname()` — match prefix (e.g., `/lifestyle/catalog/[id]` activates the Catalog item).
4. **Footer:** green status dot, "Self-hosted · v0.3.1" in mono.

### Layout

`web/vagabond-web/src/app/lifestyle/layout.tsx` wraps all lifestyle routes in a `div.app` with sidebar on the left and `main.main` on the right. `ConnectivityBanner` is rendered at the top of `main.main` — read connectivity state from `LifestylePreferencesContext` (already at `src/contexts/LifestylePreferencesContext.tsx`).

---

## Story 3 — Dashboard Screen

**Goal:** Implement the dashboard home screen.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-1.jsx` → `Dashboard`, `KPI`, `TripCard`, `ReconcileStat`, `SystemStatus`, `StatusRow`, `TripBurnCard`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/dashboard/DashboardScreen.tsx`
- `web/vagabond-web/src/app/lifestyle/page.tsx`

### Implementation

1. **Header row:** date micro text (`Today · Sun, May 17, 2026 · Mojave preserve`), `h1` ("One trip on the horizon."), "Import GPX" ghost button + "New trip" button.

2. **KPI row** (`div.kpi-row` with 5 columns):
   - Days to departure: `1d` / "Tomorrow, 06:30 PDT"
   - Total drive: `1,819mi` / "27h 48m over 3 days"
   - Work stops: `2` / "3 meetings scheduled"
   - Trip budget: `$N` / "$N/day avg · N categories"
   - Schedule feasibility: `Caution` (accent variant) / "1 stop with tight buffer"

3. **Main 2-col grid** (`div.dash-grid`):
   - **Left column:**
     - "Upcoming" section head → `TripCard` component (date column + trip metadata + feasibility pill). Click navigates to `/lifestyle/planner`.
     - "Last trip" section head → grid of 5 `ReconcileStat` cards (Solar produced, Power drawn, Water used, Peak sun, Money spent) each showing actual value, was-value, delta %. Delta color: amber if >10%, normal otherwise.
   - **Right aside:**
     - "System" section head → `SystemStatus` card: list of 6 services with colored dot + name + mono detail. Services: vagabond-server (ok), Postgres + PostGIS (ok), Map tiles (ok), Starlink (ok), Google Calendar (ok), Grafana sidecar (off/gray).
     - "Money" section head → `TripBurnCard`: trip name, total budget display, CategoryStack bar, pre-trip spend list with date/merchant/amount rows.
     - "Catalog" section head → 5-item list (Campsites 47, Trailheads 31, Water sources 14, POI 38, Hazards 12).

4. Wire all data from `vagabond-data.ts` mock.

---

## Story 4 — Trip Planner Screen

**Goal:** Implement the full trip planner with data-dominant layout, itinerary table, feasibility panel, and AI assistant rail.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-1.jsx` → `Planner`, `PlannerDataDominant`, `PlannerMapDominant`, `DayBlock`, `StopItem`, `StopInfoCard`, `ItineraryTable`, `FeasibilityPanel`, `ScheduleBlock`, `PlannerRail`, `PlannerAssistant`, `PlannerBudgetCard`, `SummaryStat`.

**Files to edit** (all exist as stubs — replace bodies):
- `web/vagabond-web/src/features/lifestyle/planner/PlannerScreen.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/PlannerDataDominant.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/PlannerMapDominant.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/DayBlock.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/StopItem.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/StopInfoCard.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/ItineraryTable.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/FeasibilityPanel.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/ScheduleBlock.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/PlannerRail.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/PlannerAssistant.tsx`
- `web/vagabond-web/src/features/lifestyle/planner/PlannerBudgetCard.tsx`

### Implementation

**PlannerScreen topbar:** breadcrumb "Trip · GA-PICKUP-26 · Confirmed", title "GA Pickup — {window}", "1 stop needs attention" warn pill, "Open in monitor" ghost button, "Sync to calendar" sage button.

**PlannerDataDominant** (default layout — data left, rail right):

*Main area (left):*
1. Summary stat bar card (6 cols): Distance, Drive time, Camp nights, Meetings, TZ drift (warn color), Budget.
2. Card with `ItineraryTable` (1.6fr) + small `VagabondMap` (1fr). Use `VagabondMap` from `src/features/lifestyle/map/VagabondMap.tsx`.
3. Feasibility card: header shows selected stop name or "Select a work stop". If work stop selected, renders `FeasibilityPanel` with 8 metrics in 4-col grid. If nothing selected, shows empty state text.
4. `PlannerBudgetCard`: category stack + per-day breakdown table.

*Rail (right):* see PlannerRail below.

**ItineraryTable:** `<table class="itin-table">` with columns: marker, Stop (name + loc sub), Type, Arrive, Depart, Local TZ, Slack pill, Connectivity. Day header rows span all 8 columns. Row click → setSelected.

**FeasibilityPanel:** 8 `FeasMetric` items in `4 × 2` grid: Arrival ETA, Pre-buffer required, Pre-buffer slack (warn if < 15min), First meeting (+ local time sub); Last meeting end, Post-buffer required, Post-buffer slack (warn if < 15min), Connectivity.

**DayBlock + StopItem:** Stop marker circles: W (work, primary color), C (camp, secondary), A (origin, secondary), Z (dest, secondary). Show arrival/departure mono. Work stops show meetings list (home time, title, duration, connectivity icon). Feasibility warn/ok pills.

**PlannerRail:** Right aside with two tabs — Schedule and Assistant (with "AI" badge). Schedule tab: `ScheduleBlock` per work stop (left border color by feasibility, meetings list). Assistant tab: `PlannerAssistant` (stub for now — see Story 13 for real wiring).

**PlannerAssistant stub:** Renders the chat UI shell (header with model name, scroll area, suggestion chips, textarea input form) but `send()` returns a placeholder: `"[AI assistant not yet configured — see Story 13 for wiring]"`. This lets the UI be tested without the API key.

**Data:** All from `vagabond-data.ts`. Selected stop state is `useState<string>` initialized to `"ws-lordsburg"`.

---

## Story 5 — Trip Detail Screen

**Goal:** Implement the trip detail / itinerary view.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-2.jsx` → `TripDetail`, `BigStat`, `FactRow`, `TimelineRow`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/trip-detail/TripDetailScreen.tsx`
- `web/vagabond-web/src/app/lifestyle/trip-detail/page.tsx`

### Implementation

1. **Hero section** (2-col grid):
   - Left: status micro + h1 trip name, lede paragraph, 4 action buttons (Sync to calendar [sage], Export GPX [ghost], Download .ics [ghost], Open in planner [ghost] → navigates to `/lifestyle/planner`).
   - Right: 3×2 `BigStat` grid — Distance (mi), Drive (h), Camp nights, Meetings, Budget ($USD), YTD trips.

2. **Detail 2-col grid** (main section + aside):
   - **Timeline** (left): `div.timeline` with `TimelineRow` for each event in order:
     - depart: "06:30 PDT · Mon May 18 · Depart Mojave preserve"
     - drive: "06:30 → 09:18 · Drive: I-15 S → I-10 E. Est. 612 mi, 9h 24m."
     - work: per work stop (name, loc, meetings list with home time / duration / connectivity)
     - camp: per camp night
     - drive: day 3 drive segment
     - arrive: "15:18 EDT · Wed May 20 · Arrive Atlanta"
     - Each row: left `.tl-time` (big time + date line), right event content. Feasibility warn pill on tight work stops.
   - **Aside** (right):
     - Trip facts `card`: ID, Window, Origin, Destination, Home TZ, TZ drift (warn color), Status pill.
     - Budget snapshot `card.card-accent`: Money planned, Pre-trip spend, Power reserve, Water end, Meals planned. "Edit budgets" ghost button.
     - Field logging `card`: "Daily log entries unlock once the trip starts." text, 3 day log items with Pending micro badge.

3. `page.tsx` renders `<TripDetailScreen />` with `SimpleTopbar crumb="Trip · GA-PICKUP-26" title="Trip detail"`.

---

## Story 6 — Budget Screen

**Goal:** Implement the budget editor with visual and spreadsheet modes.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-2.jsx` → `Budget`, `BudgetVisual`, `BudgetSpreadsheet`, `MoneyBudgetCard`, `WaterTankSvg`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/budget/BudgetScreen.tsx`
- `web/vagabond-web/src/features/lifestyle/budget/BudgetVisual.tsx`
- `web/vagabond-web/src/features/lifestyle/budget/BudgetSpreadsheet.tsx`
- `web/vagabond-web/src/features/lifestyle/budget/MoneyBudgetCard.tsx`
- `web/vagabond-web/src/features/lifestyle/budget/WaterTankSvg.tsx`

### Implementation

**BudgetScreen topbar:** crumb, "Power, water, food & money" title, "Within reserves" ok pill, Visual/Spreadsheet segment control (`.segment`), "Save defaults" sage button.

**Local state** (client component):
- `loads`: array of `{ name, watts, hours }` from mock `powerLoads`
- `psh`: peak sun hours (from mock `solar.peakSunHours`)
- `waterRate`: gal/day (from mock `waterBudget.consumptionPerDay`)
- Computed: `consumed = sum(watts × hours)`, `produced = panels × peakWatts × psh`, `net = produced - consumed`, `reserve = batteryWh + net × tripDays`

**BudgetVisual** — 4-card grid (`div.budget-grid`):

1. **Power card:** `h3` with Wh/day heading, net delta sub. Two `div.budget-meter` bars (consumption %, battery reserve % — warn/err styling by threshold). `div.budget-readout` (solar panels, battery, peak sun hours `<input>`, produced/day). Load breakdown: per-device name + Wh + mini bar.

2. **Water card:** gal-over-trip heading, carry capacity sub. `WaterTankSvg`. Readout rows (carry, rate/day `<input>`, end reserve, resupply). Per-day breakdown list.

3. **Food card:** "9 meals planned" heading, 3 meals/day avg. Per-day meal plan lists with meal entries.

4. **Money card** (`MoneyBudgetCard`): planned total, pre-trip progress bar, `CategoryStack`, per-day breakdown, last-trip calibration note, "Apply Kelso variances" ghost button.

**WaterTankSvg** — exact SVG match from prototype:
- `viewBox="0 0 240 90"`, tank rect at x=6 y=14, width=228, height=64, rx=6.
- Fill rect from left representing remaining water (not consumed).
- Tick marks at 0/25/50/75/100% with gallon labels above.
- Resupply marker at 40% (dashed vertical line, "RESUPPLY" label rect).
- Center text: `{used.toFixed(1)} / {total} gal`.

**BudgetSpreadsheet** — table-dominant layout:
1. Power loads table: Device name, Watts `<input>`, Hours `<input>`, Wh/day (computed, mono), Share (80px mini bar + %), delete button. Tfoot total row.
2. 2-col row: Solar + battery param table (left) | Water param table (right).
3. Meal plan table: Day, Breakfast, Lunch, Dinner, Calories.
4. Monetary budget table: Category (swatch + name), Planned `<input>`, Per day (computed), Share bar, Last trip actual, Note.

---

## Story 7 — Location Catalog Screen

**Goal:** Implement the filterable location catalog with table and map split view.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-3.jsx` → `Catalog`, `CatalogMap`, `TypeChip`, `Signal`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/catalog/CatalogScreen.tsx`
- `web/vagabond-web/src/features/lifestyle/catalog/CatalogMap.tsx`
- `web/vagabond-web/src/features/lifestyle/catalog/catalog-primitives.tsx`

### Implementation

**Topbar:** "Catalog · N locations" crumb, Locations title, "N shown" neutral pill, Import GPX/KML ghost buttons, "+ New location" button.

**Layout** (`div.catalog`): filter sidebar (`aside.catalog-filters`) + body (`div.catalog-body`) with table on top, map on bottom.

**Filter sidebar:**
- Text search `<input>` (search name or land unit)
- Type section with toggle chip buttons — each chip shows color swatch + label + count: Campsite (#80a08c), Trailhead (#c47a51), Water (#7faab3), POI (#b8975f), Hazard (#b34b3a), Work spot (#a86241)
- Jurisdiction chips: BLM, NPS, USFS, StateParks, Private, Unknown
- Conditions chips: Good (.cond-good), Watch (.cond-watch), Avoid (.cond-avoid), Untested (.cond-untested)
- Info note at bottom

**Catalog table** (`table.catalog-table`): Color dot | Name + land unit sub | TypeChip | Jurisdiction | Conditions | Visits | Last visit | Cell (Signal bars) | Starlink (✓ Sky / blocked) | Water | Notes. Click → select row; double-click → navigate to `/lifestyle/catalog/[id]`.

**CatalogMap** SVG (viewBox 0 0 1200 640): warm paper background, schematic state border lines (WA/OR/CA/NV/AZ/NM/TX border segments as polylines), faint I-10 highway guide line, location dots by type color with click selection. Selected location shows name + jurisdiction tooltip label. Use `lonToX`/`latToY` projection helpers from mock data (linear interpolation over bounding box: lon −124→−74 maps to x 0→1200, lat 25→49 maps to y 640→0).

**catalog-primitives.tsx:** `TypeChip({ type })` and `Signal({ bars: number })` (4-bar signal icon using `<i>` elements with `.on` class).

**Filter logic:** `useMemo` to filter `catalog` array by active types set, jurisdictions set, text query (name or landUnit).

---

## Story 8 — Location Detail Screen

**Goal:** Implement the single-location detail page.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-3.jsx` → `LocationDetail`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/catalog/LocationDetailScreen.tsx`
- `web/vagabond-web/src/app/lifestyle/catalog/[id]/page.tsx`

### Implementation

**Topbar:** "← Catalog" crumb link → `/lifestyle/catalog`, jurisdiction · land unit crumb, location name title. TypeChip, conditions pill (ok/warn/err by value), "Add to trip" + "Export GPX" ghost buttons.

**Detail grid** (`div.loc-detail-grid`, 2-col):

*Section (left):*
1. `div.loc-map-card` — `CatalogMap` with single location, full width.
2. "Notes & conditions" with timeline (`div.timeline`): hazard row if `loc.hazard` exists (red left border, "!" big text, "Active warning" micro, hazard text). Then visit log entries (date + "Visited" label + note text). "+ Add note" ghost button.
3. "Used in" section — trips referencing this location in a card: trip name, date, status pill.

*Aside (right):*
1. Facts `card`: Location ID (mono small), Coordinates (mono), Elevation (ft), Jurisdiction, Land unit, Fee.
2. Connectivity `card`: Cellular signal (Signal component + N/5 mono), Starlink (ok/err pill), Sky exposure (mono), Potable water (mono).
3. Agentic enrichment `card.card-accent`: "Deferred · v0.4" neutral pill, disabled Enable button.
4. Provenance `card`: Source, Added, Owner (mono text).

**Data:** Look up `params.id` in mock `catalog` array.

---

## Story 9 — Field Log Screen

**Goal:** Implement the in-trip field log form.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-3.jsx` → `FieldLog`, `ActualCard`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/field-log/FieldLogScreen.tsx`
- `web/vagabond-web/src/features/lifestyle/field-log/ActualCard.tsx`
- `web/vagabond-web/src/app/lifestyle/field-log/page.tsx`

### Implementation

**Topbar:** "Trip · KELSO-26 · In progress · Day 2 of 3" crumb, "Field log — {tripName}" title, "Live trip" ok pill. Save button → "Save log" (online/starlink) or disabled "Queue locally" (offline).

**Day tabs** (`div.log-day-tabs`): 3 buttons for Day 1 / Day 2 (Today) / Day 3 (Future). Active state, "today" class on current day.

**Log grid** (`div.log-grid`, 2-col):

*Form card (left):*
1. Header: "Log entry · Day N" micro, date h2, sync status pill (synced/unsaved/queued).
2. Log form grid (`div.log-form-grid`):
   - Location `<input>` (full width), hint: "Resolved from current rig coordinates · pick from catalog"
   - Weather `<input>` (full width)
   - Notes `<textarea rows="5">` (full width), hint text about indexing
3. Actuals section: 3 `ActualCard` (Power consumed Wh, Water consumed gal, Fuel gal). Each shows editable number input, unit, delta % vs predicted (color: up/down class).
4. Waypoints section: visited waypoint chips (static), "+ Add waypoint" chip button.
5. Photos section: 8-slot photo grid (`div.photo-grid`) — filled vs empty slots. Note: "Photo attachments deferred to v0.2".
6. ADR-008 sync note (`card.card-tinted`).

*Aside (right):*
1. Trip context card: Trip name, Started date, Day N of 3, Logs synced N/N.
2. Quick add card: 6 ghost buttons (Fuel stop, Water fill, Photo, Incident, Pin to catalog, Free note).
3. Connectivity card — appearance changes based on connectivity:
   - Offline: `card.card-accent` with red text warning
   - Starlink: `card.card-accent` with amber text
   - Online: normal card

**ActualCard:** editable `<input type="number">` for value, unit mono, delta percent vs predicted with `.delta.up` or `.delta.down` class.

**Connectivity:** read from `LifestylePreferencesContext`.

---

## Story 10 — Post-trip Reconciliation Screen

**Goal:** Implement the reconciliation and transaction import screen.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-3.jsx` → `Reconcile`, `TransactionsReconcile`, `ImportTile`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/reconcile/ReconcileScreen.tsx`
- `web/vagabond-web/src/features/lifestyle/reconcile/TransactionsReconcile.tsx`
- `web/vagabond-web/src/features/lifestyle/reconcile/ImportTile.tsx`

### Implementation

**Topbar:** "Trip · KELSO-26 · {window}" crumb, "Reconcile actuals" title, "Export CSV" ghost + "Apply suggested adjustments" sage buttons.

**Hero section** (2-col): trip name h1, lede paragraph, stat grid — "Within tolerance N of N" + "Adjustments N suggested".

**Metrics table** (`table.recon-table`): Metric, Predicted, Actual, Comparison (dual `div.recon-bar` — predicted bar + actual bar side by side), Delta (`.recon-delta` colored ok/warn/bad), Note. For money metrics format with `$`; otherwise show unit.

**2-col lower section:**
1. Suggested adjustments card: list of calibration changes — `what` (bold), `from → to` (mono strikethrough + new value), `reason` (soft text). "Apply all to defaults" sage button.
2. "What this enables" tinted card: 3 bullet points (Rolling calibration, Tighter feasibility, Trend detection). ADR-007 note in mono.

**TransactionsReconcile** (full-width card at bottom):
- Header with "Import another statement" ghost + "Lock in actuals" sage button (disabled if `needsReview > 0`).
- Default state: show imported data (mock `transactions` from data). Show `ImportTile` if not yet imported.
- Imported state (2-col layout):
  - *Left:* import meta (source, uploadedAt, parsed/autoCategorized/needsReview counts). Transaction table: Date (mono), Merchant + raw sub + note, Category `<select>` with confidence score sub, Amount (right-align mono bold), Status pill, Accept button for needs-review rows. Tfoot total row.
  - *Right:* rollup list by category — swatch, label, actual total, delta vs planned (ok/warn/err), bar fill, "planned $X · N txn" sub. Trip total comparison. "How matching works" info note.
- `updateCat(id, cat)`: changes category + marks as matched. `accept(id)`: marks needs-review as matched.

**ImportTile:** Drop zone with upload icon, title, description, 3 buttons (Choose file, Paste rows, Use sample). Clicking any → sets imported=true.

---

## Story 11 — Real-time Monitor Screen

**Goal:** Implement the live vehicle monitoring screen with animated telemetry.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-4.jsx` → `Monitor`, `VehicleOverlay`, `HeadStat`, `Gauge`, `Bar`, `SignalRow`, `SpeedSparkline`, `EventTicker`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/monitor/MonitorScreen.tsx`
- `web/vagabond-web/src/features/lifestyle/monitor/VehicleOverlay.tsx`
- `web/vagabond-web/src/features/lifestyle/monitor/monitor-primitives.tsx`

### Implementation

**MonitorScreen** — client component with synthetic real-time updates:

State: `progress` (0.38 initial), `now` (May 18 16:42), `speedKph` (109), `solarW` (412), `history` (60-pt seed array). `setInterval` at 1200ms: progress += 0.0006, now += 10s, speed jitter ±1.6 kph (clamp 88–118), solar jitter ±9W (clamp 280–540), history shift + append.

Derived: `speedMph`, `heading` (compass string), `remainingMi`, `etaMinutes`, `etaTime`.

**Monitor topbar** (dense variant — `topbar monitor-topbar`): live dot + "Live · vehicle VAN-01 · HH:MM MDT" crumb, "Real-time monitor" title, `HeadStat` row (Speed/mph, Heading/°, To camp/mi, ETA/MDT, $ today / budget), "Open planner" ghost button.

**Monitor frame** (`div.monitor-frame`): full-height `div.monitor-map` + bottom `EventTicker`.

**Map layer:** `VagabondMap` base + `VehicleOverlay` SVG (absolutely positioned over map).

**5 overlay cards** using `div.map-overlay` positioning classes (tl, tr, bl, bl2, br):

- **TL — Vehicle** (`monitor-card`): `Gauge` row (Speed, RPM, Engine °F with horizontal fill bar), divider, 2-col key-value grid (Heading, Alt, Trip, Odo).
- **TR — Power & resources**: 5 `Bar` components — House battery SoC%, Solar input W, Fresh water %, Grey water %, Fuel %.
- **BL — Next stop**: stop name display, arrival/distance/drive key-values, `SpeedSparkline`, time axis labels (−60 min, avg mph, now).
- **BL2 — Day spend** (below BL): budget meter, last 3 charges list (time, merchant, category swatch, amount).
- **BR — Connectivity**: 3 `SignalRow` items (Cellular/Verizon LTE, Starlink/standby, Local LAN), divider, 2×2 env grid (Cabin °F, Outside °F, Humidity, Wind).

**VehicleOverlay SVG** (absolute, viewBox 0 0 1200 640): completed trail path (primary color, strokeWidth 4), ghost dashed line to next stop, 2 animated pulse ring circles (SVG `<animate>`), vehicle chevron `<path d="M 0 -7 L 5 5 L 0 2 L -5 5 Z">` rotated to heading, "VAN-01 · MOVING" label rect.

**SpeedSparkline SVG**: 268×36 viewBox, 60-point polyline, area fill (opacity 0.15), 65mph baseline dashed line.

**EventTicker**: bottom strip with live dot, "Event log" micro, auto-scroll list of 5 events with tone coloring (primary/sage/neutral by event kind: workstop=primary, calendar=sage, rest=neutral).

**monitor-primitives.tsx:** `HeadStat`, `Gauge`, `Bar`, `SignalRow`, `Kv` components.

---

## Story 12 — Settings Screen

**Goal:** Implement the settings screen with all 7 sections.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-2.jsx` → `Settings`, `RigSettings`, `IntegrationsSettings`, `CalendarSettings`, `TelemetrySettings`, `CatalogSettings`, `NavSettings`, `AccountSettings`, `FieldRow`, `Toggle`, `IntegrationRow`.

**Files to edit:**
- `web/vagabond-web/src/features/lifestyle/settings/SettingsScreen.tsx`
- `web/vagabond-web/src/features/lifestyle/settings/settings-sections.tsx`

### Implementation

**Layout** (`div.page.page-narrow`): title area + `div.settings-grid` (nav sidebar left, content section right).

**Settings nav** (`nav.settings-nav`): 7 `button.nav-item` entries — Rig profile, Integrations, Calendar, Telemetry, Location catalog, Navigation, Account & sync. Active state via local `useState<string>`.

**Shared in settings-sections.tsx:**
- `FieldRow({ label, hint?, children })` — `div.field-row` grid with label + hint on left, control on right
- `Toggle({ on, onChange })` — `div.toggle` with `.on` class when active, `role="switch"`
- `SectionHead2({ title, sub })` — h2 + subtitle paragraph

**Rig profile section:**
- Rig name text input (default "The Cab — 2018 F-250")
- Solar array: count × peak watts number inputs
- Battery capacity Wh number input
- Fresh water capacity gal number input
- Daily water rate gal/day number input, step 0.1
- Solar enabled toggle
- Home time zone select (PDT/MDT/CDT/EDT options)

**Integrations section:** `IntegrationRow` per service with pill + Manage/Connect button:
- Google Calendar: connected (ok pill)
- Apple Maps: not-connected (neutral)
- Gaia GPS: export-only (neutral)
- OsmAnd: export-only (neutral)
- iOverlander: not-connected (neutral), "planned v0.2" hint
- recreation.gov: not-connected (neutral), "planned v0.2" hint
- Anthropic Claude: opt-in (neutral), "Powers agentic location enrichment (v0.4). Disabled by default." hint

**Calendar section:** auto-push toggle, prep & pack event toggle, event title prefix text input (default "🚐 Vagabond"), ICS export button.

**Telemetry section:** OTLP exporter select (Off/Console/OTLP HTTP), Grafana sidecar toggle (default off), self-hosted-only ok pill (read-only).

**Location catalog section:** default jurisdiction select, agentic enrichment neutral pill "Disabled · v0.4", soft-delete toggle (default on).

**Navigation section:** primary field nav select, GPX export format display (mono text, read-only), map basemap select.

**Account section:** identity provider mono text, token encryption ok pill, backups mono text (last pg_dump time).

All toggles use local `useState` — no persistence.

---

## Story 13 — Trip Planner AI Assistant (real API wiring)

**Goal:** Wire `PlannerAssistant` to Anthropic Claude via a streaming Next.js API route. Do this after Story 4 is complete.

**Design source:** `../design/vagabond-lifestyle-manager/project/screens-1.jsx` → `PlannerAssistant` (system prompt, trip context builder, streaming UI).

**Files to create/edit:**
- `web/vagabond-web/src/app/api/assistant/route.ts` — create
- `web/vagabond-web/src/features/lifestyle/planner/PlannerAssistant.tsx` — replace stub

### API route (`/api/assistant` POST)

```ts
// Body: { messages: {role: "user"|"assistant"; content: string}[]; tripContext: string }
// Returns: text/event-stream
```

- Use `@anthropic-ai/sdk` (`Anthropic` client, `claude-haiku-4-5` model)
- System prompt (cache with `cache_control: { type: "ephemeral" }`):
  > "You are the Vagabond trip co-pilot — a concise, calm assistant for a self-hosted RV trip planner. Reply in short, plain sentences. Surface concrete suggestions and tradeoffs over generic advice. When numbers help, use them. Do not invent stops that aren't in the trip; you can propose alternatives, but flag them as proposals."
- First user message block: inject `tripContext` string (cache with `cache_control: { type: "ephemeral" }`), then conversation messages
- Stream response tokens back using `anthropic.messages.stream()`, pipe as SSE (`data: <token>\n\n`)
- Return `new Response(stream, { headers: { "Content-Type": "text/event-stream" } })`
- Add `ANTHROPIC_API_KEY` to `.env.example` with placeholder comment

### PlannerAssistant component updates

**Trip context builder** (`useMemo`): matches prototype exactly —
```
Trip: {name} ({id}) — {window}
Route: {totalMiles} mi, {driveHours}h drive over N days; crosses {crossesTz}.

Stops:
- [{kind}] {name} @ {loc} — arr {arrival}, dep {departure} — meetings: ... — slack pre +Nm / post +Nm ({feasible}) — fallback: ...

Monetary budget: ${total} planned over N days.
By category: Fuel $X, Food $Y, ...
Pre-trip spend already on card: $X.XX (N charges).
```

**Streaming fetch:**
```ts
const res = await fetch("/api/assistant", { method: "POST", body: JSON.stringify({ messages, tripContext }) });
const reader = res.body!.getReader();
// Append tokens to last assistant message in state as they stream in
```

**Suggestion chips:** 4 pre-set prompts from prototype: "Why is Weatherford tight?", "Propose a fallback for day 2", "Re-time the customer demo to give 30m slack", "Where can I add a sunset stop without breaking the schedule?".

**Error state:** display in chat window with red styling if fetch throws or server returns 4xx/5xx.

---

## Implementation order

1. **Story 1** — CSS + primitives (everything else depends on these)
2. **Story 2** — App shell / sidebar (dependency for all screens)
3. **Stories 3–12** — any order, parallel if multiple agents running
4. **Story 13** — after Story 4 (Planner) is done
