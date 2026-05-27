-- 0005_trip_events.sql
-- Timestamped field event journal for a trip.
-- One row per discrete event (fuel fill, stop, hike, campsite, etc.).
-- Complements field_logs (daily aggregates) — these are the granular records.

CREATE TABLE trip_events (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type   TEXT        NOT NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at     TIMESTAMPTZ,
    location     GEOMETRY(Point, 4326),
    notes        TEXT,
    payload      JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT trip_events_ended_after_occurred
        CHECK (ended_at IS NULL OR ended_at >= occurred_at)
);

CREATE INDEX trip_events_trip_id_occurred_idx ON trip_events (trip_id, occurred_at);
CREATE INDEX trip_events_trip_id_type_idx     ON trip_events (trip_id, event_type);
CREATE INDEX trip_events_location_idx         ON trip_events USING GIST (location)
    WHERE location IS NOT NULL;
