-- 0002_core_schema.sql

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_sub TEXT NOT NULL UNIQUE,   -- Keycloak subject claim
    email        TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Rigs ─────────────────────────────────────────────────────────────────────
CREATE TABLE rigs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    make                TEXT NOT NULL,
    model               TEXT NOT NULL,
    year                INT  NOT NULL,
    fuel_capacity_gal   NUMERIC(6,2),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX rigs_user_id_idx ON rigs(user_id);

-- ── Gear items ────────────────────────────────────────────────────────────────
CREATE TABLE gear_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rig_id       UUID NOT NULL REFERENCES rigs(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    weight_oz    NUMERIC(8,2),
    storage_zone TEXT NOT NULL DEFAULT 'rear_cargo',
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX gear_items_rig_id_idx ON gear_items(rig_id);

-- ── Trips ─────────────────────────────────────────────────────────────────────
CREATE TABLE trips (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trips_user_id_idx ON trips(user_id);

-- ── Trip legs ─────────────────────────────────────────────────────────────────
CREATE TABLE trip_legs (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seq     INT  NOT NULL,
    name    TEXT,
    UNIQUE (trip_id, seq)
);

CREATE INDEX trip_legs_trip_id_idx ON trip_legs(trip_id);

-- ── Waypoints (spatial) ───────────────────────────────────────────────────────
CREATE TABLE waypoints (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leg_id  UUID NOT NULL REFERENCES trip_legs(id) ON DELETE CASCADE,
    seq     INT  NOT NULL,
    name    TEXT NOT NULL,
    notes   TEXT,
    geom    geometry(Point, 4326) NOT NULL,
    UNIQUE (leg_id, seq)
);

CREATE INDEX waypoints_leg_id_idx  ON waypoints(leg_id);
CREATE INDEX waypoints_geom_idx    ON waypoints USING GIST(geom);

-- ── Routes (imported GPX LineStrings) ────────────────────────────────────────
CREATE TABLE routes (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leg_id   UUID NOT NULL REFERENCES trip_legs(id) ON DELETE CASCADE,
    name     TEXT,
    source   TEXT NOT NULL DEFAULT 'gpx',  -- 'gpx' | 'drawn'
    geom     geometry(LineString, 4326) NOT NULL
);

CREATE INDEX routes_leg_id_idx ON routes(leg_id);
CREATE INDEX routes_geom_idx   ON routes USING GIST(geom);

-- ── Campsites (spatial) ───────────────────────────────────────────────────────
CREATE TABLE campsites (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id        UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    campsite_type  TEXT NOT NULL DEFAULT 'dispersed',
    notes          TEXT,
    geom           geometry(Point, 4326) NOT NULL
);

CREATE INDEX campsites_trip_id_idx ON campsites(trip_id);
CREATE INDEX campsites_geom_idx    ON campsites USING GIST(geom);
