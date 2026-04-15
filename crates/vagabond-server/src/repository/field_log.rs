use chrono::{DateTime, NaiveDate, Utc};
use sqlx::PgPool;
use uuid::Uuid;
use vagabond_core::field_log::FieldLog;
use vagabond_core::VagabondError;

#[derive(Debug)]
pub struct LogInput {
    pub log_date: NaiveDate,
    pub notes: Option<String>,
    pub actual_power_consumed_wh: Option<f64>,
    pub actual_water_consumed_gal: Option<f64>,
    pub actual_weather: Option<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct FieldLogRow {
    id: Uuid,
    trip_id: Uuid,
    user_id: Uuid,
    log_date: NaiveDate,
    notes: Option<String>,
    actual_power_consumed_wh: Option<f64>,
    actual_water_consumed_gal: Option<f64>,
    actual_weather: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

fn row_to_field_log(row: FieldLogRow) -> FieldLog {
    FieldLog {
        id: row.id,
        trip_id: row.trip_id,
        user_id: row.user_id,
        log_date: row.log_date,
        notes: row.notes,
        actual_power_consumed_wh: row.actual_power_consumed_wh,
        actual_water_consumed_gal: row.actual_water_consumed_gal,
        actual_weather: row.actual_weather,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn map_db_err(e: sqlx::Error) -> VagabondError {
    if let sqlx::Error::Database(ref db) = e {
        if db.code().as_deref() == Some("23505") {
            return VagabondError::Validation("field log already exists for this date".into());
        }
    }
    tracing::error!(error = %e, "database error");
    VagabondError::Validation("could not complete database operation".into())
}

pub async fn list_for_trip(
    db: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<FieldLog>, VagabondError> {
    let rows: Vec<FieldLogRow> = sqlx::query_as(
        r#"
        SELECT f.id,
               f.trip_id,
               f.user_id,
               f.log_date,
               f.notes,
               f.actual_power_consumed_wh::float8 AS actual_power_consumed_wh,
               f.actual_water_consumed_gal::float8 AS actual_water_consumed_gal,
               f.actual_weather,
               f.created_at,
               f.updated_at
        FROM field_logs f
        INNER JOIN trips t ON t.id = f.trip_id
        WHERE f.trip_id = $1
          AND t.user_id = $2
        ORDER BY f.log_date ASC
        "#,
    )
    .bind(trip_id)
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(map_db_err)?;

    Ok(rows.into_iter().map(row_to_field_log).collect())
}

pub async fn get_by_date(
    db: &PgPool,
    trip_id: Uuid,
    date: NaiveDate,
    user_id: Uuid,
) -> Result<FieldLog, VagabondError> {
    let row: Option<FieldLogRow> = sqlx::query_as(
        r#"
        SELECT f.id,
               f.trip_id,
               f.user_id,
               f.log_date,
               f.notes,
               f.actual_power_consumed_wh::float8 AS actual_power_consumed_wh,
               f.actual_water_consumed_gal::float8 AS actual_water_consumed_gal,
               f.actual_weather,
               f.created_at,
               f.updated_at
        FROM field_logs f
        INNER JOIN trips t ON t.id = f.trip_id
        WHERE f.trip_id = $1
          AND f.log_date = $2
          AND t.user_id = $3
        "#,
    )
    .bind(trip_id)
    .bind(date)
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_field_log).ok_or_else(|| {
        VagabondError::NotFound(format!("field log not found for trip {trip_id} on {date}"))
    })
}

pub async fn create(
    db: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
    body: &LogInput,
) -> Result<FieldLog, VagabondError> {
    let row: Option<FieldLogRow> = sqlx::query_as(
        r#"
        INSERT INTO field_logs (
            trip_id,
            user_id,
            log_date,
            notes,
            actual_power_consumed_wh,
            actual_water_consumed_gal,
            actual_weather
        )
        SELECT t.id, $2, $3, $4, $5, $6, $7
        FROM trips t
        WHERE t.id = $1
          AND t.user_id = $2
        RETURNING id,
                  trip_id,
                  user_id,
                  log_date,
                  notes,
                  actual_power_consumed_wh::float8 AS actual_power_consumed_wh,
                  actual_water_consumed_gal::float8 AS actual_water_consumed_gal,
                  actual_weather,
                  created_at,
                  updated_at
        "#,
    )
    .bind(trip_id)
    .bind(user_id)
    .bind(body.log_date)
    .bind(&body.notes)
    .bind(body.actual_power_consumed_wh)
    .bind(body.actual_water_consumed_gal)
    .bind(&body.actual_weather)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_field_log)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {trip_id}")))
}

pub async fn upsert(
    db: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
    body: &LogInput,
) -> Result<FieldLog, VagabondError> {
    let row: Option<FieldLogRow> = sqlx::query_as(
        r#"
        INSERT INTO field_logs (
            trip_id,
            user_id,
            log_date,
            notes,
            actual_power_consumed_wh,
            actual_water_consumed_gal,
            actual_weather
        )
        SELECT t.id, $2, $3, $4, $5, $6, $7
        FROM trips t
        WHERE t.id = $1
          AND t.user_id = $2
        ON CONFLICT (trip_id, log_date) DO UPDATE
        SET notes = EXCLUDED.notes,
            actual_power_consumed_wh = EXCLUDED.actual_power_consumed_wh,
            actual_water_consumed_gal = EXCLUDED.actual_water_consumed_gal,
            actual_weather = EXCLUDED.actual_weather,
            updated_at = now()
        RETURNING id,
                  trip_id,
                  user_id,
                  log_date,
                  notes,
                  actual_power_consumed_wh::float8 AS actual_power_consumed_wh,
                  actual_water_consumed_gal::float8 AS actual_water_consumed_gal,
                  actual_weather,
                  created_at,
                  updated_at
        "#,
    )
    .bind(trip_id)
    .bind(user_id)
    .bind(body.log_date)
    .bind(&body.notes)
    .bind(body.actual_power_consumed_wh)
    .bind(body.actual_water_consumed_gal)
    .bind(&body.actual_weather)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_field_log)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {trip_id}")))
}

pub async fn delete(
    db: &PgPool,
    trip_id: Uuid,
    date: NaiveDate,
    user_id: Uuid,
) -> Result<(), VagabondError> {
    let result = sqlx::query(
        r#"
        DELETE FROM field_logs f
        USING trips t
        WHERE f.trip_id = t.id
          AND f.trip_id = $1
          AND f.log_date = $2
          AND t.user_id = $3
        "#,
    )
    .bind(trip_id)
    .bind(date)
    .bind(user_id)
    .execute(db)
    .await
    .map_err(map_db_err)?;

    if result.rows_affected() == 0 {
        return Err(VagabondError::NotFound(format!(
            "field log not found for trip {trip_id} on {date}"
        )));
    }

    Ok(())
}
