-- Rig power system profile inputs for ADR-007 (US-006)
ALTER TABLE rigs
    ADD COLUMN battery_capacity_wh double precision,
    ADD COLUMN solar_peak_watts double precision;
