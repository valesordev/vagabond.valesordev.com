//! Trip event CRUD endpoints (`/api/v1/trips/:trip_id/events`).

use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value as JsonValue};
use uuid::Uuid;
use vagabond_core::trip_event::TripEvent;
use vagabond_core::VagabondError;

use crate::error::ApiError;
use crate::extractors::UserId;
use crate::repository::trip as trip_repo;
use crate::repository::trip_event as event_repo;
use crate::response::ok_envelope;
use crate::state::AppState;

// ── Request / response types ──────────────────────────────────────────────────

#[derive(Debug, Deserialize, Default)]
pub struct ListEventsQuery {
    pub event_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEventBody {
    /// Discriminant string, e.g. "fuel_fill", "stop", "hike". Required.
    pub event_type: String,
    /// When the event occurred. Defaults to server time if omitted.
    pub occurred_at: Option<DateTime<Utc>>,
    /// When the event ended (for duration-bounded events like hikes, campsites).
    pub ended_at: Option<DateTime<Utc>>,
    pub lon: Option<f64>,
    pub lat: Option<f64>,
    pub notes: Option<String>,
    /// Typed payload — shape depends on event_type. Stored as JSONB.
    pub payload: Option<JsonValue>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEventBody {
    pub occurred_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub lon: Option<f64>,
    pub lat: Option<f64>,
    pub notes: Option<String>,
    pub payload: Option<JsonValue>,
}

#[derive(Debug, Serialize)]
struct EventResponse {
    id: Uuid,
    trip_id: Uuid,
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

impl From<TripEvent> for EventResponse {
    fn from(e: TripEvent) -> Self {
        let payload = e.payload.and_then(|p| serde_json::to_value(p).ok());
        Self {
            id: e.id,
            trip_id: e.trip_id,
            event_type: e.event_type,
            occurred_at: e.occurred_at,
            ended_at: e.ended_at,
            lon: e.lon,
            lat: e.lat,
            notes: e.notes,
            payload,
            created_at: e.created_at,
            updated_at: e.updated_at,
        }
    }
}

fn map_json_rejection(r: JsonRejection) -> ApiError {
    ApiError::from(VagabondError::Validation(r.to_string()))
}

fn map_query_rejection(r: QueryRejection) -> ApiError {
    ApiError::from(VagabondError::Validation(r.to_string()))
}

fn validate_lon_lat(lon: Option<f64>, lat: Option<f64>) -> Result<(), ApiError> {
    if let Some(lon) = lon {
        if !(-180.0..=180.0).contains(&lon) {
            return Err(ApiError::from(VagabondError::Validation(
                "lon must be within [-180, 180]".into(),
            )));
        }
    }
    if let Some(lat) = lat {
        if !(-90.0..=90.0).contains(&lat) {
            return Err(ApiError::from(VagabondError::Validation(
                "lat must be within [-90, 90]".into(),
            )));
        }
    }
    if lon.is_some() != lat.is_some() {
        return Err(ApiError::from(VagabondError::Validation(
            "lon and lat must both be provided or both omitted".into(),
        )));
    }
    Ok(())
}

// ── Handlers ──────────────────────────────────────────────────────────────────

pub async fn list(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
    query: Result<Query<ListEventsQuery>, QueryRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Query(query) = query.map_err(map_query_rejection)?;
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    let events =
        event_repo::list_for_trip(&state.db, trip_id, user.0, query.event_type.as_deref()).await?;
    let data: Vec<EventResponse> = events.into_iter().map(EventResponse::from).collect();
    let total = data.len();
    Ok(ok_envelope(data, json!({ "total": total })))
}

pub async fn get(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, event_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let event = event_repo::get_by_id(&state.db, trip_id, event_id, user.0).await?;
    Ok(ok_envelope(EventResponse::from(event), json!({})))
}

pub async fn create(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
    body: Result<Json<CreateEventBody>, JsonRejection>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;

    let event_type = body.event_type.trim().to_string();
    if event_type.is_empty() {
        return Err(ApiError::from(VagabondError::Validation(
            "event_type must not be empty".into(),
        )));
    }
    validate_lon_lat(body.lon, body.lat)?;

    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;

    let input = event_repo::EventInput {
        event_type,
        occurred_at: body.occurred_at,
        ended_at: body.ended_at,
        lon: body.lon,
        lat: body.lat,
        notes: body
            .notes
            .map(|n| n.trim().to_string())
            .filter(|n| !n.is_empty()),
        payload: body.payload,
    };
    let event = event_repo::create(&state.db, trip_id, user.0, &input).await?;
    Ok((
        StatusCode::CREATED,
        ok_envelope(EventResponse::from(event), json!({})),
    ))
}

pub async fn update(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, event_id)): Path<(Uuid, Uuid)>,
    body: Result<Json<UpdateEventBody>, JsonRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    validate_lon_lat(body.lon, body.lat)?;

    let upd = event_repo::EventUpdate {
        occurred_at: body.occurred_at,
        ended_at: body.ended_at,
        lon: body.lon,
        lat: body.lat,
        notes: body
            .notes
            .map(|n| n.trim().to_string())
            .filter(|n| !n.is_empty()),
        payload: body.payload,
    };
    let event = event_repo::update(&state.db, trip_id, event_id, user.0, &upd).await?;
    Ok(ok_envelope(EventResponse::from(event), json!({})))
}

pub async fn delete(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, event_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    event_repo::delete(&state.db, trip_id, event_id, user.0).await?;
    Ok(ok_envelope(
        serde_json::Value::Null,
        json!({ "deleted": true }),
    ))
}
