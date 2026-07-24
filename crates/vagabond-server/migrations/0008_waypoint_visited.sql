-- Waypoint visited state (US-010)
ALTER TABLE waypoints
    ADD COLUMN visited boolean NOT NULL DEFAULT false,
    ADD COLUMN visited_at timestamptz;
