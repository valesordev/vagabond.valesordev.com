use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;
use sqlx::PgPool;
use uuid::Uuid;
use vagabond_core::trip_event::{EventPayload, TripEvent};
use vagabond_core::VagabondError;

#[derive(Debug)]
pub struct EventInput {
    pub event_type: String,
    pub occurred_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub lon: Option<f64>,
    pub lat: Option<f64>,
    pub notes: Option<String>,
    pub payload: Option<JsonValue>,
}

#[derive(Debug)]
pub struct EventUpdate {
    pub occurred_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub lon: Option<f64>,
    pub lat: Option<f64>,
    pub notes: Option<String>,
    pub payload: Option<JsonValue>,
}

#[derive(Debug, sqlx::FromRow)]
struct TripEventRow {
    id: Uuid,
    trip_id: Uuid,
    user_id: Uuid,
    event_type: String,
    occurred_at: DateTime<Utc>,
    ended_at: Option<DateTime<Utc>>,
    lon: Option<f64>,
    lat: Option<f64>,
    notes: Option<String>,
    payload: Option<JsonValue>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

fn row_to_event(row: TripEventRow) -> TripEvent {
    let payload = row
        .payload
        .and_then(|v| serde_json::from_value::<EventPayload>(v).ok());
    TripEvent {
        id: row.id,
        trip_id: row.trip_id,
        user_id: row.user_id,
        event_type: row.event_type,
        occurred_at: row.occurred_at,
        ended_at: row.ended_at,
        lon: row.lon,
        lat: row.lat,
        notes: row.notes,
        payload,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn map_db_err(e: sqlx::Error) -> VagabondError {
    tracing::error!(error = %e, "database error in trip_event repository");
    VagabondError::Validation("could not complete database operation".into())
}

const EVENT_SELECT: &str = r#"
    SELECT e.id,
           e.trip_id,
           e.user_id,
           e.event_type,
           e.occurred_at,
           e.ended_at,
           ST_X(e.location) AS lon,
           ST_Y(e.location) AS lat,
           e.notes,
           e.payload,
           e.created_at,
           e.updated_at
    FROM trip_events e
    INNER JOIN trips t ON t.id = e.trip_id
"#;

pub async fn list_for_trip(
    db: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
    event_type_filter: Option<&str>,
) -> Result<Vec<TripEvent>, VagabondError> {
    let rows: Vec<TripEventRow> = if let Some(et) = event_type_filter {
        sqlx::query_as(&format!(
            "{EVENT_SELECT}
            WHERE e.trip_id = $1 AND t.user_id = $2 AND e.event_type = $3
            ORDER BY e.occurred_at ASC"
        ))
        .bind(trip_id)
        .bind(user_id)
        .bind(et)
        .fetch_all(db)
        .await
        .map_err(map_db_err)?
    } else {
        sqlx::query_as(&format!(
            "{EVENT_SELECT}
            WHERE e.trip_id = $1 AND t.user_id = $2
            ORDER BY e.occurred_at ASC"
        ))
        .bind(trip_id)
        .bind(user_id)
        .fetch_all(db)
        .await
        .map_err(map_db_err)?
    };

    Ok(rows.into_iter().map(row_to_event).collect())
}

pub async fn get_by_id(
    db: &PgPool,
    trip_id: Uuid,
    event_id: Uuid,
    user_id: Uuid,
) -> Result<TripEvent, VagabondError> {
    let row: Option<TripEventRow> = sqlx::query_as(&format!(
        "{EVENT_SELECT}
        WHERE e.id = $1 AND e.trip_id = $2 AND t.user_id = $3"
    ))
    .bind(event_id)
    .bind(trip_id)
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_event)
        .ok_or_else(|| VagabondError::NotFound(format!("event not found: {event_id}")))
}

pub async fn create(
    db: &PgPool,
    trip_id: Uuid,
    user_id: Uuid,
    input: &EventInput,
) -> Result<TripEvent, VagabondError> {
    let occurred_at = input.occurred_at.unwrap_or_else(Utc::now);
    let make_point = match (input.lon, input.lat) {
        (Some(lon), Some(lat)) => {
            format!("ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)")
        }
        _ => "NULL".to_string(),
    };

    let sql = format!(
        r#"
        INSERT INTO trip_events
            (trip_id, user_id, event_type, occurred_at, ended_at, location, notes, payload)
        SELECT t.id, $2, $3, $4, $5, {make_point}, $6, $7
        FROM trips t
        WHERE t.id = $1 AND t.user_id = $2
        RETURNING id,
                  trip_id,
                  user_id,
                  event_type,
                  occurred_at,
                  ended_at,
                  ST_X(location) AS lon,
                  ST_Y(location) AS lat,
                  notes,
                  payload,
                  created_at,
                  updated_at
        "#
    );

    let row: Option<TripEventRow> = sqlx::query_as(&sql)
        .bind(trip_id)
        .bind(user_id)
        .bind(&input.event_type)
        .bind(occurred_at)
        .bind(input.ended_at)
        .bind(&input.notes)
        .bind(&input.payload)
        .fetch_optional(db)
        .await
        .map_err(map_db_err)?;

    row.map(row_to_event)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {trip_id}")))
}

pub async fn update(
    db: &PgPool,
    trip_id: Uuid,
    event_id: Uuid,
    user_id: Uuid,
    upd: &EventUpdate,
) -> Result<TripEvent, VagabondError> {
    let make_point = match (upd.lon, upd.lat) {
        (Some(lon), Some(lat)) => format!("ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)"),
        _ => "NULL".to_string(),
    };

    let sql = format!(
        r#"
        UPDATE trip_events e
        SET occurred_at = COALESCE($4, e.occurred_at),
            ended_at    = $5,
            location    = {make_point},
            notes       = $6,
            payload     = COALESCE($7, e.payload),
            updated_at  = now()
        FROM trips t
        WHERE e.id = $1
          AND e.trip_id = $2
          AND e.trip_id = t.id
          AND t.user_id = $3
        RETURNING e.id,
                  e.trip_id,
                  e.user_id,
                  e.event_type,
                  e.occurred_at,
                  e.ended_at,
                  ST_X(e.location) AS lon,
                  ST_Y(e.location) AS lat,
                  e.notes,
                  e.payload,
                  e.created_at,
                  e.updated_at
        "#
    );

    let row: Option<TripEventRow> = sqlx::query_as(&sql)
        .bind(event_id)
        .bind(trip_id)
        .bind(user_id)
        .bind(upd.occurred_at)
        .bind(upd.ended_at)
        .bind(&upd.notes)
        .bind(&upd.payload)
        .fetch_optional(db)
        .await
        .map_err(map_db_err)?;

    row.map(row_to_event)
        .ok_or_else(|| VagabondError::NotFound(format!("event not found: {event_id}")))
}

pub async fn delete(
    db: &PgPool,
    trip_id: Uuid,
    event_id: Uuid,
    user_id: Uuid,
) -> Result<(), VagabondError> {
    let result = sqlx::query(
        r#"
        DELETE FROM trip_events e
        USING trips t
        WHERE e.id = $1
          AND e.trip_id = $2
          AND e.trip_id = t.id
          AND t.user_id = $3
        "#,
    )
    .bind(event_id)
    .bind(trip_id)
    .bind(user_id)
    .execute(db)
    .await
    .map_err(map_db_err)?;

    if result.rows_affected() == 0 {
        return Err(VagabondError::NotFound(format!(
            "event not found: {event_id}"
        )));
    }
    Ok(())
}
