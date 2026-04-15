# ADR-007: Budget Calculation Engine

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Brian (initial)

## Context

Trip planning requires calculating power, water, and food budgets before a trip and then
logging actuals during/after to calibrate future predictions. The Kelso Dunes trip plan
demonstrates the shape of this work: daily load table × hours = Wh/day, solar production
estimate, net draw against battery capacity, water carry vs. consumption rate, meal plan by
day.

Today this is done manually in markdown. Vagabond needs to automate it and close the loop
with real data.

Two design questions:
1. Where does the calculation logic live? (crate placement)
2. How does the actual vs. predicted feedback loop work?

## Decision

**Calculation logic lives in `vagabond-core` as pure functions.**

Budget calculators are deterministic functions: given typed inputs (rig profile, trip
parameters), they return typed budget outputs. No I/O, no async, no PostGIS. They are
straightforward to unit-test and have no reason to live anywhere else.

**Budget types (in `vagabond-core::budget`):**

```
PowerBudget
  ├── loads: Vec<PowerLoad>          (device, draw_watts, hours_per_day)
  ├── solar_panels: Vec<SolarPanel>  (peak_watts, panel_count)
  ├── battery_capacity_wh: f64
  ├── peak_sun_hours: f64            (default 6.0 for desert; user-adjustable)
  ├── daily_production_wh: f64       (calculated)
  ├── daily_consumption_wh: f64      (calculated)
  ├── net_daily_wh: f64              (calculated; negative = net draw from battery)
  └── trip_end_reserve_wh: f64       (calculated; battery_capacity - (net_daily × days))

WaterBudget
  ├── carry_gallons: f64
  ├── consumption_rate_gal_per_day: f64   (default 2.0; user-adjustable per trip)
  ├── trip_days: u32
  ├── resupply_points: Vec<ResupplyPoint> (location_id, estimated_day)
  └── end_reserve_gallons: f64            (calculated)

FoodPlan
  ├── trip_days: u32
  ├── meals_per_day: u32
  └── days: Vec<FoodDay>             (meal entries with name/calories/weight)
```

**The feedback loop:**

`FieldLog` entries (one per trip day) carry the actual values:
- `actual_power_consumed_wh: Option<f64>`
- `actual_water_consumed_gal: Option<f64>`
- `actual_peak_sun_hours: Option<f64>`

After a trip, a reconciliation function in `vagabond-core::budget` compares predicted vs.
actual and emits a `BudgetCalibration` — a signed delta per metric. The server persists these
calibrations and applies them as user-specific defaults on future trip budgets:

```
BudgetCalibration
  ├── user_id: Uuid
  ├── source_trip_id: Uuid
  ├── metric: CalibrationMetric      (SolarProduction | WaterConsumption | ...)
  ├── predicted: f64
  ├── actual: f64
  └── delta_pct: f64
```

Calibration is advisory: user can always override any default. The system uses the rolling
average delta across all calibrations for that metric as the adjusted default.

## Consequences

**Positive**
- Pure functions are trivially testable — no database, no HTTP in budget tests
- Calculation logic is reusable from CLI tools, the telemetry agent, or any future interface
- Feedback loop makes predictions more accurate over time without requiring user effort
- FoodPlan, PowerBudget, WaterBudget are first-class trip artifacts, not just notes

**Negative**
- Solar production estimate (peak sun hours) requires geographic/seasonal lookup to be
  truly accurate — for now, a user-adjustable constant is acceptable; a future integration
  with NOAA solar data would improve v0.3 predictions
- Calibration only works if users actually log actuals — no logged data means no improvement

## Alternatives Considered

- **Budget calculations in `vagabond-server` handlers**: mixes business logic into HTTP
  handlers; makes unit testing dependent on the full server stack; rejected
- **Separate `vagabond-budget` crate**: premature — these are core domain calculations
  directly tied to the rig and trip models already in `vagabond-core`; overkill until the
  calculation surface grows significantly
- **Static templates (user fills in the math)**: what the markdown workflow is today;
  explicitly rejected as the problem to solve
