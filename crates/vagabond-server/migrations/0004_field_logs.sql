-- 0004_field_logs.sql

CREATE TABLE field_logs (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                   UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id                   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date                  DATE        NOT NULL,
    notes                     TEXT,
    actual_power_consumed_wh  NUMERIC(10,2),
    actual_water_consumed_gal NUMERIC(8,3),
    actual_weather            TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, log_date)
);

CREATE INDEX field_logs_trip_id_idx ON field_logs(trip_id);
