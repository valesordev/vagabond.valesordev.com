-- 0003_telemetry.sql
-- Kept in a separate migration so the core planning schema
-- is usable independently (ADR-002: telemetry decoupled from planning).

CREATE TABLE telemetry_sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at   TIMESTAMPTZ,
    agent_id   TEXT                   -- RPi hostname or identifier
);

CREATE INDEX telemetry_sessions_trip_id_idx ON telemetry_sessions(trip_id);

CREATE TABLE telemetry_points (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID        NOT NULL REFERENCES telemetry_sessions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL,
    geom        geometry(Point, 4326) NOT NULL,
    altitude_m  NUMERIC(8,2),
    speed_kph   NUMERIC(6,2),
    heading_deg NUMERIC(5,2),
    -- Power stats — nullable; populated when Victron/Jackery telemetry is present
    battery_pct NUMERIC(5,2),
    solar_w     NUMERIC(7,2)
);

CREATE INDEX telemetry_points_session_id_idx ON telemetry_points(session_id);
CREATE INDEX telemetry_points_recorded_at_idx ON telemetry_points(recorded_at DESC);
CREATE INDEX telemetry_points_geom_idx        ON telemetry_points USING GIST(geom);
