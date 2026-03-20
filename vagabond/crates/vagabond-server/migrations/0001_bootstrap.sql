-- 0001_bootstrap.sql
-- Enable required extensions. Must run as superuser once per DB.
-- In Docker Compose this runs automatically via the postgres init script.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
