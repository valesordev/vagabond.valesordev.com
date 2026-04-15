//! Trip CRUD (`/api/v1/trips`). Leg endpoints remain TODO.

use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;
use vagabond_core::trip::{
    normalize_trip_description, trip_list_pagination, validate_trip_name, Trip,
};
use vagabond_core::VagabondError;

use crate::error::ApiError;
use crate::extractors::UserId;
use crate::repository::trip as trip_repo;
use crate::response::ok_envelope;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateTripBody {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTripBody {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct ListTripsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
struct TripResponse {
    id: Uuid,
    user_id: Uuid,
    name: String,
    description: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<Trip> for TripResponse {
    fn from(t: Trip) -> Self {
        Self {
            id: t.id,
            user_id: t.user_id,
            name: t.name,
            description: t.description,
            created_at: t.created_at,
            updated_at: t.updated_at,
        }
    }
}

fn map_json_rejection(r: JsonRejection) -> ApiError {
    ApiError::from(VagabondError::Validation(r.to_string()))
}

fn map_query_rejection(r: QueryRejection) -> ApiError {
    ApiError::from(VagabondError::Validation(r.to_string()))
}

pub async fn list(
    State(state): State<AppState>,
    user: UserId,
    query: Result<Query<ListTripsQuery>, QueryRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Query(query) = query.map_err(map_query_rejection)?;
    let (limit, offset) = trip_list_pagination(query.limit, query.offset)?;
    let (trips, total) = trip_repo::list_for_user(&state.db, user.0, limit, offset).await?;
    let data: Vec<TripResponse> = trips.into_iter().map(TripResponse::from).collect();
    Ok(ok_envelope(
        data,
        json!({
            "total": total,
            "limit": limit,
            "offset": offset
        }),
    ))
}

pub async fn get(
    State(state): State<AppState>,
    user: UserId,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let trip = trip_repo::get_by_id_for_user(&state.db, id, user.0).await?;
    Ok(ok_envelope(TripResponse::from(trip), json!({})))
}

pub async fn create(
    State(state): State<AppState>,
    user: UserId,
    body: Result<Json<CreateTripBody>, JsonRejection>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    let name = validate_trip_name(&body.name)?;
    let description = normalize_trip_description(body.description)?;
    let trip = trip_repo::create(&state.db, user.0, &name, description).await?;
    Ok((
        StatusCode::CREATED,
        ok_envelope(TripResponse::from(trip), json!({})),
    ))
}

pub async fn update(
    State(state): State<AppState>,
    user: UserId,
    Path(id): Path<Uuid>,
    body: Result<Json<UpdateTripBody>, JsonRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    let name = validate_trip_name(&body.name)?;
    let description = normalize_trip_description(body.description)?;
    let trip = trip_repo::update_for_user(&state.db, id, user.0, &name, description).await?;
    Ok(ok_envelope(TripResponse::from(trip), json!({})))
}

pub async fn delete(
    State(state): State<AppState>,
    user: UserId,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    trip_repo::delete_for_user(&state.db, id, user.0).await?;
    Ok(ok_envelope(
        serde_json::Value::Null,
        json!({ "deleted": true }),
    ))
}

pub async fn list_legs() -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}

pub async fn create_leg() -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}
