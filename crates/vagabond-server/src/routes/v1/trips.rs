//! Trip CRUD and leg/waypoint endpoints (`/api/v1/trips`).

use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Multipart, Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::NaiveDate;
use gpx::read as read_gpx;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::io::Cursor;
use uuid::Uuid;
use vagabond_core::field_log::FieldLog;
use vagabond_core::trip::{
    normalize_trip_description, trip_list_pagination, validate_trip_name, Trip,
};
use vagabond_core::VagabondError;

use crate::error::ApiError;
use crate::extractors::UserId;
use crate::repository::field_log as field_log_repo;
use crate::repository::trip as trip_repo;
use crate::response::ok_envelope;
use crate::state::AppState;

const MAX_GPX_FILE_BYTES: usize = 10 * 1024 * 1024;

#[derive(Debug, Deserialize)]
pub struct CreateTripBody {
    pub name: String,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTripBody {
    pub name: String,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize, Default)]
pub struct ListTripsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLegBody {
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWaypointBody {
    pub name: String,
    pub notes: Option<String>,
    pub lon: f64,
    pub lat: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWaypointBody {
    pub name: String,
    pub notes: Option<String>,
    pub lon: f64,
    pub lat: f64,
    pub visited: Option<bool>,
    pub visited_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct LogBody {
    pub log_date: NaiveDate,
    pub notes: Option<String>,
    pub actual_power_consumed_wh: Option<f64>,
    pub actual_water_consumed_gal: Option<f64>,
    pub actual_weather: Option<String>,
}

#[derive(Debug, Serialize)]
struct TripResponse {
    id: Uuid,
    user_id: Uuid,
    name: String,
    description: Option<String>,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
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
            start_date: t.start_date,
            end_date: t.end_date,
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

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
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
    let trip = trip_repo::create(
        &state.db,
        user.0,
        &name,
        description,
        body.start_date,
        body.end_date,
    )
    .await?;
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
    let trip = trip_repo::update_for_user(
        &state.db,
        id,
        user.0,
        &name,
        description,
        body.start_date,
        body.end_date,
    )
    .await?;
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

pub async fn list_legs(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    let legs = trip_repo::list_legs(&state.db, trip_id, user.0).await?;
    Ok(ok_envelope(
        &legs,
        json!({
            "total": legs.len()
        }),
    ))
}

pub async fn create_leg(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
    body: Result<Json<CreateLegBody>, JsonRejection>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    let name = body
        .name
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty());
    let leg = trip_repo::create_leg(&state.db, trip_id, user.0, name.as_deref()).await?;
    Ok((StatusCode::CREATED, ok_envelope(leg, json!({}))))
}

pub async fn list_waypoints(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, leg_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    trip_repo::ensure_leg_for_trip(&state.db, trip_id, leg_id, user.0).await?;
    let waypoints = trip_repo::list_waypoints(&state.db, leg_id, user.0).await?;
    Ok(ok_envelope(
        &waypoints,
        json!({
            "total": waypoints.len()
        }),
    ))
}

pub async fn create_waypoint(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, leg_id)): Path<(Uuid, Uuid)>,
    body: Result<Json<CreateWaypointBody>, JsonRejection>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    trip_repo::ensure_leg_for_trip(&state.db, trip_id, leg_id, user.0).await?;
    let name = body.name.trim();
    if name.is_empty() {
        return Err(ApiError::from(VagabondError::Validation(
            "waypoint name must not be empty".into(),
        )));
    }
    if !(-180.0..=180.0).contains(&body.lon) {
        return Err(ApiError::from(VagabondError::Validation(
            "lon must be within [-180, 180]".into(),
        )));
    }
    if !(-90.0..=90.0).contains(&body.lat) {
        return Err(ApiError::from(VagabondError::Validation(
            "lat must be within [-90, 90]".into(),
        )));
    }
    let notes = body
        .notes
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty());
    let waypoint = trip_repo::create_waypoint(
        &state.db,
        leg_id,
        user.0,
        name,
        notes.as_deref(),
        body.lon,
        body.lat,
    )
    .await?;
    Ok((StatusCode::CREATED, ok_envelope(waypoint, json!({}))))
}

pub async fn update_waypoint(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, leg_id, id)): Path<(Uuid, Uuid, Uuid)>,
    body: Result<Json<UpdateWaypointBody>, JsonRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    trip_repo::ensure_leg_for_trip(&state.db, trip_id, leg_id, user.0).await?;
    let name = body.name.trim();
    if name.is_empty() {
        return Err(ApiError::from(VagabondError::Validation(
            "waypoint name must not be empty".into(),
        )));
    }
    if !(-180.0..=180.0).contains(&body.lon) {
        return Err(ApiError::from(VagabondError::Validation(
            "lon must be within [-180, 180]".into(),
        )));
    }
    if !(-90.0..=90.0).contains(&body.lat) {
        return Err(ApiError::from(VagabondError::Validation(
            "lat must be within [-90, 90]".into(),
        )));
    }
    let notes = body
        .notes
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty());

    let existing = trip_repo::list_waypoints(&state.db, leg_id, user.0)
        .await?
        .into_iter()
        .find(|w| w.id == id)
        .ok_or_else(|| VagabondError::NotFound(format!("waypoint not found: {id}")))?;

    let visited = body.visited.unwrap_or(existing.visited);
    let visited_at = if !visited {
        None
    } else if let Some(ts) = body.visited_at {
        Some(ts)
    } else if existing.visited {
        existing.visited_at
    } else {
        Some(chrono::Utc::now())
    };

    let waypoint = trip_repo::update_waypoint(
        &state.db,
        id,
        user.0,
        trip_repo::UpdateWaypointInput {
            name,
            notes: notes.as_deref(),
            lon: body.lon,
            lat: body.lat,
            visited,
            visited_at,
        },
    )
    .await?;
    Ok(ok_envelope(waypoint, json!({})))
}

pub async fn delete_waypoint(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, leg_id, id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    trip_repo::ensure_leg_for_trip(&state.db, trip_id, leg_id, user.0).await?;
    trip_repo::delete_waypoint(&state.db, id, user.0).await?;
    Ok(ok_envelope(
        serde_json::Value::Null,
        json!({ "deleted": true }),
    ))
}

pub async fn list_all_waypoints(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    let waypoints = trip_repo::list_all_waypoints_for_trip(&state.db, trip_id, user.0).await?;
    Ok(ok_envelope(
        &waypoints,
        json!({
            "total": waypoints.len()
        }),
    ))
}

pub async fn list_logs(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;
    let logs = field_log_repo::list_for_trip(&state.db, trip_id, user.0).await?;
    Ok(ok_envelope(
        &logs,
        json!({
            "total": logs.len()
        }),
    ))
}

pub async fn get_log(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, date)): Path<(Uuid, NaiveDate)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let log = field_log_repo::get_by_date(&state.db, trip_id, date, user.0).await?;
    Ok(ok_envelope(log, json!({})))
}

pub async fn create_log(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
    body: Result<Json<LogBody>, JsonRejection>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    let input = field_log_repo::LogInput {
        log_date: body.log_date,
        notes: normalize_optional_text(body.notes),
        actual_power_consumed_wh: body.actual_power_consumed_wh,
        actual_water_consumed_gal: body.actual_water_consumed_gal,
        actual_weather: normalize_optional_text(body.actual_weather),
    };
    let created = field_log_repo::create(&state.db, trip_id, user.0, &input)
        .await
        .map_err(|err| match err {
            VagabondError::Validation(msg) if msg == "field log already exists for this date" => {
                ApiError::new(StatusCode::CONFLICT, "LOG_DATE_CONFLICT", msg)
            }
            other => ApiError::from(other),
        })?;
    Ok((StatusCode::CREATED, ok_envelope(created, json!({}))))
}

pub async fn upsert_log(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, date)): Path<(Uuid, NaiveDate)>,
    body: Result<Json<LogBody>, JsonRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    if body.log_date != date {
        return Err(ApiError::from(VagabondError::Validation(
            "body.log_date must match URL date".into(),
        )));
    }
    let input = field_log_repo::LogInput {
        log_date: date,
        notes: normalize_optional_text(body.notes),
        actual_power_consumed_wh: body.actual_power_consumed_wh,
        actual_water_consumed_gal: body.actual_water_consumed_gal,
        actual_weather: normalize_optional_text(body.actual_weather),
    };
    let log: FieldLog = field_log_repo::upsert(&state.db, trip_id, user.0, &input).await?;
    Ok(ok_envelope(log, json!({})))
}

pub async fn delete_log(
    State(state): State<AppState>,
    user: UserId,
    Path((trip_id, date)): Path<(Uuid, NaiveDate)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    field_log_repo::delete(&state.db, trip_id, date, user.0).await?;
    Ok(ok_envelope(
        serde_json::Value::Null,
        json!({ "deleted": true }),
    ))
}

#[derive(Debug, Serialize)]
struct ImportGpxResponse {
    leg_id: Uuid,
    leg_name: String,
    waypoints_imported: usize,
    routes_imported: usize,
}

fn waypoint_name(explicit: Option<&str>, fallback_index: usize) -> String {
    explicit
        .map(str::trim)
        .filter(|name| !name.is_empty())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| format!("Waypoint {fallback_index}"))
}

fn route_name(explicit: Option<&str>, fallback_index: usize) -> String {
    explicit
        .map(str::trim)
        .filter(|name| !name.is_empty())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| format!("Imported Route {fallback_index}"))
}

fn wpt_lon_lat(point: &gpx::Waypoint) -> (f64, f64) {
    let p = point.point();
    (p.x(), p.y())
}

pub async fn import_gpx(
    State(state): State<AppState>,
    user: UserId,
    Path(trip_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    trip_repo::get_by_id_for_user(&state.db, trip_id, user.0).await?;

    let mut file_bytes: Option<Vec<u8>> = None;
    while let Some(field) = multipart.next_field().await.map_err(|err| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            "MISSING_FILE",
            format!("invalid multipart payload: {err}"),
        )
    })? {
        if field.name() != Some("file") {
            continue;
        }
        let bytes = field.bytes().await.map_err(|err| {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                "MISSING_FILE",
                format!("could not read file payload: {err}"),
            )
        })?;
        if bytes.len() > MAX_GPX_FILE_BYTES {
            return Err(ApiError::new(
                StatusCode::PAYLOAD_TOO_LARGE,
                "FILE_TOO_LARGE",
                "gpx file exceeds 10 MB limit",
            ));
        }
        file_bytes = Some(bytes.to_vec());
        break;
    }

    let file_bytes = file_bytes.ok_or_else(|| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            "MISSING_FILE",
            "multipart field `file` is required",
        )
    })?;

    let gpx = read_gpx(Cursor::new(&file_bytes)).map_err(|err| {
        ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "INVALID_GPX",
            format!("invalid gpx: {err}"),
        )
    })?;

    let leg_name = gpx
        .metadata
        .as_ref()
        .and_then(|m| m.name.as_ref())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .unwrap_or("Imported Route")
        .to_string();

    let mut tx = state.db.begin().await.map_err(|err| {
        ApiError::from(VagabondError::Validation(format!(
            "could not begin transaction: {err}"
        )))
    })?;

    let leg = trip_repo::create_leg_in_tx(&mut tx, trip_id, user.0, Some(&leg_name)).await?;

    let mut seq_counter: usize = 0;
    let mut waypoints_imported = 0usize;
    let mut routes_imported = 0usize;

    for waypoint in &gpx.waypoints {
        seq_counter += 1;
        let name = waypoint_name(waypoint.name.as_deref(), seq_counter);
        let (lon, lat) = wpt_lon_lat(waypoint);
        let notes = waypoint
            .description
            .as_deref()
            .map(str::trim)
            .filter(|text| !text.is_empty());
        trip_repo::create_waypoint_in_tx(&mut tx, leg.id, user.0, &name, notes, lon, lat).await?;
        waypoints_imported += 1;
    }

    for (route_idx, route) in gpx.routes.iter().enumerate() {
        let coordinates: Vec<(f64, f64)> = route.points.iter().map(wpt_lon_lat).collect();
        if coordinates.len() >= 2 {
            let name = route_name(route.name.as_deref(), route_idx + 1);
            trip_repo::create_route_in_tx(&mut tx, leg.id, Some(&name), "gpx", &coordinates)
                .await?;
            routes_imported += 1;
        }
        for point in &route.points {
            if point.name.is_none() {
                continue;
            }
            seq_counter += 1;
            let name = waypoint_name(point.name.as_deref(), seq_counter);
            let (lon, lat) = wpt_lon_lat(point);
            let notes = point
                .description
                .as_deref()
                .map(str::trim)
                .filter(|text| !text.is_empty());
            trip_repo::create_waypoint_in_tx(&mut tx, leg.id, user.0, &name, notes, lon, lat)
                .await?;
            waypoints_imported += 1;
        }
    }

    for (track_idx, track) in gpx.tracks.iter().enumerate() {
        let mut coordinates: Vec<(f64, f64)> = Vec::new();
        for segment in &track.segments {
            for point in &segment.points {
                coordinates.push(wpt_lon_lat(point));
                if point.name.is_none() {
                    continue;
                }
                seq_counter += 1;
                let name = waypoint_name(point.name.as_deref(), seq_counter);
                let (lon, lat) = wpt_lon_lat(point);
                let notes = point
                    .description
                    .as_deref()
                    .map(str::trim)
                    .filter(|text| !text.is_empty());
                trip_repo::create_waypoint_in_tx(&mut tx, leg.id, user.0, &name, notes, lon, lat)
                    .await?;
                waypoints_imported += 1;
            }
        }
        if coordinates.len() >= 2 {
            let name = route_name(track.name.as_deref(), track_idx + 1);
            trip_repo::create_route_in_tx(&mut tx, leg.id, Some(&name), "gpx_track", &coordinates)
                .await?;
            routes_imported += 1;
        }
    }

    if waypoints_imported == 0 && routes_imported == 0 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "EMPTY_GPX",
            "gpx contained no waypoints or track/route geometry",
        ));
    }

    tx.commit().await.map_err(|err| {
        ApiError::from(VagabondError::Validation(format!(
            "could not commit transaction: {err}"
        )))
    })?;

    Ok((
        StatusCode::CREATED,
        ok_envelope(
            ImportGpxResponse {
                leg_id: leg.id,
                leg_name,
                waypoints_imported,
                routes_imported,
            },
            json!({}),
        ),
    ))
}
