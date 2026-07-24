use chrono::{DateTime, NaiveDate, Utc};
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;
use vagabond_core::{
    trip::{FlatWaypoint, Trip, TripLeg, Waypoint},
    VagabondError,
};

#[derive(Debug, sqlx::FromRow)]
struct TripRow {
    id: Uuid,
    user_id: Uuid,
    name: String,
    description: Option<String>,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow)]
struct TripLegRow {
    id: Uuid,
    trip_id: Uuid,
    seq: i32,
    name: Option<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct WaypointRow {
    id: Uuid,
    leg_id: Uuid,
    seq: i32,
    name: String,
    notes: Option<String>,
    lon: f64,
    lat: f64,
    visited: bool,
    visited_at: Option<DateTime<Utc>>,
}

#[derive(Debug, sqlx::FromRow)]
struct FlatWaypointRow {
    id: Uuid,
    leg_id: Uuid,
    trip_id: Uuid,
    leg_seq: i32,
    seq: i32,
    name: String,
    lon: f64,
    lat: f64,
    visited: bool,
    visited_at: Option<DateTime<Utc>>,
}

fn row_to_trip(row: TripRow) -> Trip {
    Trip {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        start_date: row.start_date,
        end_date: row.end_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn row_to_trip_leg(row: TripLegRow) -> TripLeg {
    TripLeg {
        id: row.id,
        trip_id: row.trip_id,
        seq: row.seq,
        name: row.name,
    }
}

fn row_to_waypoint(row: WaypointRow) -> Waypoint {
    Waypoint {
        id: row.id,
        leg_id: row.leg_id,
        seq: row.seq,
        name: row.name,
        notes: row.notes,
        lon: row.lon,
        lat: row.lat,
        visited: row.visited,
        visited_at: row.visited_at,
    }
}

fn row_to_flat_waypoint(row: FlatWaypointRow) -> FlatWaypoint {
    FlatWaypoint {
        id: row.id,
        leg_id: row.leg_id,
        trip_id: row.trip_id,
        leg_seq: row.leg_seq,
        seq: row.seq,
        name: row.name,
        lon: row.lon,
        lat: row.lat,
        visited: row.visited,
        visited_at: row.visited_at,
    }
}

fn map_db_err(e: sqlx::Error) -> VagabondError {
    if let sqlx::Error::Database(ref db) = e {
        if db.code().as_deref() == Some("23503") {
            return VagabondError::Validation(
                "invalid reference: related row does not exist (check user_id)".into(),
            );
        }
    }
    tracing::error!(error = %e, "database error");
    VagabondError::Validation("could not complete database operation".into())
}

pub async fn list_for_user(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
    offset: i64,
) -> Result<(Vec<Trip>, i64), VagabondError> {
    let total: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint
        FROM trips
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(map_db_err)?;

    let rows: Vec<TripRow> = sqlx::query_as(
        r#"
        SELECT id, user_id, name, description, start_date, end_date, created_at, updated_at
        FROM trips
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(user_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
    .map_err(map_db_err)?;

    Ok((rows.into_iter().map(row_to_trip).collect(), total))
}

pub async fn get_by_id_for_user(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
) -> Result<Trip, VagabondError> {
    let row: Option<TripRow> = sqlx::query_as(
        r#"
        SELECT id, user_id, name, description, start_date, end_date, created_at, updated_at
        FROM trips
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_trip)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {id}")))
}

pub async fn create(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    description: Option<String>,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
) -> Result<Trip, VagabondError> {
    let row: TripRow = sqlx::query_as(
        r#"
        INSERT INTO trips (user_id, name, description, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, name, description, start_date, end_date, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(name)
    .bind(description)
    .bind(start_date)
    .bind(end_date)
    .fetch_one(pool)
    .await
    .map_err(map_db_err)?;

    Ok(row_to_trip(row))
}

pub async fn update_for_user(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    name: &str,
    description: Option<String>,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
) -> Result<Trip, VagabondError> {
    let row: Option<TripRow> = sqlx::query_as(
        r#"
        UPDATE trips
        SET name = $3,
            description = $4,
            start_date = $5,
            end_date = $6,
            updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, name, description, start_date, end_date, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(name)
    .bind(description)
    .bind(start_date)
    .bind(end_date)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_trip)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {id}")))
}

pub async fn delete_for_user(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
) -> Result<bool, VagabondError> {
    let result = sqlx::query(
        r#"
        DELETE FROM trips
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .execute(pool)
    .await
    .map_err(map_db_err)?;

    if result.rows_affected() == 0 {
        return Err(VagabondError::NotFound(format!("trip not found: {id}")));
    }
    Ok(true)
}

pub async fn list_legs(
    pool: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<TripLeg>, VagabondError> {
    let rows: Vec<TripLegRow> = sqlx::query_as(
        r#"
        SELECT l.id, l.trip_id, l.seq, l.name
        FROM trip_legs l
        INNER JOIN trips t ON t.id = l.trip_id
        WHERE l.trip_id = $1
          AND t.user_id = $2
        ORDER BY l.seq ASC
        "#,
    )
    .bind(trip_id)
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(map_db_err)?;

    Ok(rows.into_iter().map(row_to_trip_leg).collect())
}

pub async fn create_leg(
    pool: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
    name: Option<&str>,
) -> Result<TripLeg, VagabondError> {
    let row: Option<TripLegRow> = sqlx::query_as(
        r#"
        WITH next_seq AS (
            SELECT COALESCE(MAX(l.seq), 0) + 1 AS seq
            FROM trip_legs l
            WHERE l.trip_id = $1
        )
        INSERT INTO trip_legs (trip_id, seq, name)
        SELECT t.id, n.seq, $3
        FROM trips t
        CROSS JOIN next_seq n
        WHERE t.id = $1
          AND t.user_id = $2
        RETURNING id, trip_id, seq, name
        "#,
    )
    .bind(trip_id)
    .bind(user_id)
    .bind(name)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_trip_leg)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {trip_id}")))
}

pub async fn create_leg_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    trip_id: Uuid,
    user_id: Uuid,
    name: Option<&str>,
) -> Result<TripLeg, VagabondError> {
    let row: Option<TripLegRow> = sqlx::query_as(
        r#"
        WITH next_seq AS (
            SELECT COALESCE(MAX(l.seq), 0) + 1 AS seq
            FROM trip_legs l
            WHERE l.trip_id = $1
        )
        INSERT INTO trip_legs (trip_id, seq, name)
        SELECT t.id, n.seq, $3
        FROM trips t
        CROSS JOIN next_seq n
        WHERE t.id = $1
          AND t.user_id = $2
        RETURNING id, trip_id, seq, name
        "#,
    )
    .bind(trip_id)
    .bind(user_id)
    .bind(name)
    .fetch_optional(&mut **tx)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_trip_leg)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {trip_id}")))
}

pub async fn list_waypoints(
    pool: &PgPool,
    leg_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<Waypoint>, VagabondError> {
    let rows: Vec<WaypointRow> = sqlx::query_as(
        r#"
        SELECT w.id, w.leg_id, w.seq, w.name, w.notes,
               ST_X(w.geom) AS lon,
               ST_Y(w.geom) AS lat,
               w.visited,
               w.visited_at
        FROM waypoints w
        INNER JOIN trip_legs l ON l.id = w.leg_id
        INNER JOIN trips t ON t.id = l.trip_id
        WHERE w.leg_id = $1
          AND t.user_id = $2
        ORDER BY w.seq ASC
        "#,
    )
    .bind(leg_id)
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(map_db_err)?;

    Ok(rows.into_iter().map(row_to_waypoint).collect())
}

pub async fn create_waypoint(
    pool: &PgPool,
    leg_id: Uuid,
    user_id: Uuid,
    name: &str,
    notes: Option<&str>,
    lon: f64,
    lat: f64,
) -> Result<Waypoint, VagabondError> {
    let row: Option<WaypointRow> = sqlx::query_as(
        r#"
        WITH next_seq AS (
            SELECT COALESCE(MAX(w.seq), 0) + 1 AS seq
            FROM waypoints w
            WHERE w.leg_id = $1
        )
        INSERT INTO waypoints (leg_id, seq, name, notes, geom)
        SELECT l.id, n.seq, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)
        FROM trip_legs l
        INNER JOIN trips t ON t.id = l.trip_id
        CROSS JOIN next_seq n
        WHERE l.id = $1
          AND t.user_id = $2
        RETURNING id, leg_id, seq, name, notes, ST_X(geom) AS lon, ST_Y(geom) AS lat,
                  visited, visited_at
        "#,
    )
    .bind(leg_id)
    .bind(user_id)
    .bind(name)
    .bind(notes)
    .bind(lon)
    .bind(lat)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_waypoint)
        .ok_or_else(|| VagabondError::NotFound(format!("leg not found: {leg_id}")))
}

pub async fn create_waypoint_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    leg_id: Uuid,
    user_id: Uuid,
    name: &str,
    notes: Option<&str>,
    lon: f64,
    lat: f64,
) -> Result<Waypoint, VagabondError> {
    let row: Option<WaypointRow> = sqlx::query_as(
        r#"
        WITH next_seq AS (
            SELECT COALESCE(MAX(w.seq), 0) + 1 AS seq
            FROM waypoints w
            WHERE w.leg_id = $1
        )
        INSERT INTO waypoints (leg_id, seq, name, notes, geom)
        SELECT l.id, n.seq, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)
        FROM trip_legs l
        INNER JOIN trips t ON t.id = l.trip_id
        CROSS JOIN next_seq n
        WHERE l.id = $1
          AND t.user_id = $2
        RETURNING id, leg_id, seq, name, notes, ST_X(geom) AS lon, ST_Y(geom) AS lat,
                  visited, visited_at
        "#,
    )
    .bind(leg_id)
    .bind(user_id)
    .bind(name)
    .bind(notes)
    .bind(lon)
    .bind(lat)
    .fetch_optional(&mut **tx)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_waypoint)
        .ok_or_else(|| VagabondError::NotFound(format!("leg not found: {leg_id}")))
}

#[derive(Debug)]
pub struct UpdateWaypointInput<'a> {
    pub name: &'a str,
    pub notes: Option<&'a str>,
    pub lon: f64,
    pub lat: f64,
    pub visited: bool,
    pub visited_at: Option<DateTime<Utc>>,
}

pub async fn update_waypoint(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    input: UpdateWaypointInput<'_>,
) -> Result<Waypoint, VagabondError> {
    let row: Option<WaypointRow> = sqlx::query_as(
        r#"
        UPDATE waypoints w
        SET name = $3,
            notes = $4,
            geom = ST_SetSRID(ST_MakePoint($5, $6), 4326),
            visited = $7,
            visited_at = $8
        FROM trip_legs l, trips t
        WHERE w.id = $1
          AND w.leg_id = l.id
          AND l.trip_id = t.id
          AND t.user_id = $2
        RETURNING w.id, w.leg_id, w.seq, w.name, w.notes,
                  ST_X(w.geom) AS lon, ST_Y(w.geom) AS lat,
                  w.visited, w.visited_at
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.name)
    .bind(input.notes)
    .bind(input.lon)
    .bind(input.lat)
    .bind(input.visited)
    .bind(input.visited_at)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_waypoint)
        .ok_or_else(|| VagabondError::NotFound(format!("waypoint not found: {id}")))
}

pub async fn create_route(
    db: &PgPool,
    leg_id: Uuid,
    name: Option<&str>,
    source: &str,
    coordinates: &[(f64, f64)],
) -> Result<Uuid, VagabondError> {
    if coordinates.len() < 2 {
        return Err(VagabondError::Validation(
            "route requires at least 2 coordinates".into(),
        ));
    }
    let linestring = coordinates
        .iter()
        .map(|(lon, lat)| format!("{lon} {lat}"))
        .collect::<Vec<_>>()
        .join(", ");
    let wkt = format!("LINESTRING({linestring})");
    let route_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO routes (leg_id, name, source, geom)
        VALUES ($1, $2, $3, ST_GeomFromText($4, 4326))
        RETURNING id
        "#,
    )
    .bind(leg_id)
    .bind(name)
    .bind(source)
    .bind(wkt)
    .fetch_one(db)
    .await
    .map_err(map_db_err)?;
    Ok(route_id)
}

pub async fn create_route_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    leg_id: Uuid,
    name: Option<&str>,
    source: &str,
    coordinates: &[(f64, f64)],
) -> Result<Uuid, VagabondError> {
    if coordinates.len() < 2 {
        return Err(VagabondError::Validation(
            "route requires at least 2 coordinates".into(),
        ));
    }
    let linestring = coordinates
        .iter()
        .map(|(lon, lat)| format!("{lon} {lat}"))
        .collect::<Vec<_>>()
        .join(", ");
    let wkt = format!("LINESTRING({linestring})");
    let route_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO routes (leg_id, name, source, geom)
        VALUES ($1, $2, $3, ST_GeomFromText($4, 4326))
        RETURNING id
        "#,
    )
    .bind(leg_id)
    .bind(name)
    .bind(source)
    .bind(wkt)
    .fetch_one(&mut **tx)
    .await
    .map_err(map_db_err)?;
    Ok(route_id)
}

pub async fn delete_waypoint(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<(), VagabondError> {
    let result = sqlx::query(
        r#"
        DELETE FROM waypoints w
        USING trip_legs l, trips t
        WHERE w.id = $1
          AND w.leg_id = l.id
          AND l.trip_id = t.id
          AND t.user_id = $2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .execute(pool)
    .await
    .map_err(map_db_err)?;

    if result.rows_affected() == 0 {
        return Err(VagabondError::NotFound(format!("waypoint not found: {id}")));
    }
    Ok(())
}

pub async fn list_all_waypoints_for_trip(
    pool: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<FlatWaypoint>, VagabondError> {
    let rows: Vec<FlatWaypointRow> = sqlx::query_as(
        r#"
        SELECT w.id,
               w.leg_id,
               l.trip_id,
               l.seq AS leg_seq,
               w.seq,
               w.name,
               ST_X(w.geom) AS lon,
               ST_Y(w.geom) AS lat,
               w.visited,
               w.visited_at
        FROM waypoints w
        INNER JOIN trip_legs l ON l.id = w.leg_id
        INNER JOIN trips t ON t.id = l.trip_id
        WHERE l.trip_id = $1
          AND t.user_id = $2
        ORDER BY l.seq ASC, w.seq ASC
        "#,
    )
    .bind(trip_id)
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(map_db_err)?;

    Ok(rows.into_iter().map(row_to_flat_waypoint).collect())
}

pub async fn ensure_leg_for_trip(
    pool: &PgPool,
    trip_id: Uuid,
    leg_id: Uuid,
    user_id: Uuid,
) -> Result<(), VagabondError> {
    let exists: Option<i32> = sqlx::query_scalar(
        r#"
        SELECT 1
        FROM trip_legs l
        INNER JOIN trips t ON t.id = l.trip_id
        WHERE l.id = $1
          AND l.trip_id = $2
          AND t.user_id = $3
        "#,
    )
    .bind(leg_id)
    .bind(trip_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    if exists.is_none() {
        return Err(VagabondError::NotFound(format!(
            "leg not found for trip: {leg_id}"
        )));
    }
    Ok(())
}
