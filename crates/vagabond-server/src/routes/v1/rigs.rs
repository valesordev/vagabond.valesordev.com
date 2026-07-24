use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;
use vagabond_core::rig::StorageZone;
use vagabond_core::VagabondError;

use crate::error::ApiError;
use crate::extractors::UserId;
use crate::repository::rig as rig_repo;
use crate::response::ok_envelope;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateRigBody {
    pub name: String,
    pub make: String,
    pub model: String,
    pub year: i32,
    pub fuel_capacity_gal: Option<f64>,
    pub battery_capacity_wh: Option<f64>,
    pub solar_peak_watts: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRigBody {
    pub name: String,
    pub make: String,
    pub model: String,
    pub year: i32,
    pub fuel_capacity_gal: Option<f64>,
    pub battery_capacity_wh: Option<f64>,
    pub solar_peak_watts: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateGearBody {
    pub name: String,
    pub category: String,
    pub weight_oz: Option<f64>,
    pub storage_zone: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGearBody {
    pub name: String,
    pub category: String,
    pub weight_oz: Option<f64>,
    pub storage_zone: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
struct DeletedResponse {
    deleted: bool,
}

fn map_json_rejection(r: JsonRejection) -> ApiError {
    ApiError::from(VagabondError::Validation(r.to_string()))
}

fn validate_name(name: &str, field: &str) -> Result<String, VagabondError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(VagabondError::Validation(format!(
            "{field} cannot be empty"
        )));
    }
    if trimmed.len() > 256 {
        return Err(VagabondError::Validation(format!(
            "{field} must be 256 characters or fewer"
        )));
    }
    Ok(trimmed.to_string())
}

fn validate_storage_zone(value: &str) -> Result<StorageZone, VagabondError> {
    match value.trim() {
        "rear_cargo" => Ok(StorageZone::RearCargo),
        "cargo_carrier" => Ok(StorageZone::CargoCarrier),
        "cab" => Ok(StorageZone::Cab),
        "rooftop" => Ok(StorageZone::Rooftop),
        "other" => Ok(StorageZone::Other),
        _ => Err(VagabondError::Validation(
            "storage_zone must be one of: rear_cargo, cargo_carrier, cab, rooftop, other".into(),
        )),
    }
}

pub async fn list(
    State(state): State<AppState>,
    user: UserId,
) -> Result<Json<serde_json::Value>, ApiError> {
    let rigs = rig_repo::list_for_user(&state.db, user.0).await?;
    Ok(ok_envelope(rigs, json!({})))
}

pub async fn create(
    State(state): State<AppState>,
    user: UserId,
    body: Result<Json<CreateRigBody>, JsonRejection>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    let input = rig_repo::CreateRigInput {
        name: validate_name(&body.name, "name")?,
        make: validate_name(&body.make, "make")?,
        model: validate_name(&body.model, "model")?,
        year: body.year,
        fuel_capacity_gal: body.fuel_capacity_gal,
        battery_capacity_wh: body.battery_capacity_wh,
        solar_peak_watts: body.solar_peak_watts,
        notes: body
            .notes
            .map(|n| n.trim().to_string())
            .filter(|n| !n.is_empty()),
    };
    let rig = rig_repo::create(&state.db, user.0, input).await?;
    Ok((StatusCode::CREATED, ok_envelope(rig, json!({}))))
}

pub async fn get(
    State(state): State<AppState>,
    user: UserId,
    Path(rig_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let rig = rig_repo::get_by_id_for_user(&state.db, rig_id, user.0).await?;
    Ok(ok_envelope(rig, json!({})))
}

pub async fn update(
    State(state): State<AppState>,
    user: UserId,
    Path(rig_id): Path<Uuid>,
    body: Result<Json<UpdateRigBody>, JsonRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    let input = rig_repo::UpdateRigInput {
        name: validate_name(&body.name, "name")?,
        make: validate_name(&body.make, "make")?,
        model: validate_name(&body.model, "model")?,
        year: body.year,
        fuel_capacity_gal: body.fuel_capacity_gal,
        battery_capacity_wh: body.battery_capacity_wh,
        solar_peak_watts: body.solar_peak_watts,
        notes: body
            .notes
            .map(|n| n.trim().to_string())
            .filter(|n| !n.is_empty()),
    };
    let rig = rig_repo::update_for_user(&state.db, rig_id, user.0, input).await?;
    Ok(ok_envelope(rig, json!({})))
}

pub async fn delete(
    State(state): State<AppState>,
    user: UserId,
    Path(rig_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    rig_repo::delete_for_user(&state.db, rig_id, user.0).await?;
    Ok(ok_envelope(DeletedResponse { deleted: true }, json!({})))
}

pub async fn list_gear(
    State(state): State<AppState>,
    user: UserId,
    Path(rig_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let gear = rig_repo::list_gear_for_rig(&state.db, rig_id, user.0).await?;
    Ok(ok_envelope(gear, json!({})))
}

pub async fn create_gear(
    State(state): State<AppState>,
    user: UserId,
    Path(rig_id): Path<Uuid>,
    body: Result<Json<CreateGearBody>, JsonRejection>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    let storage_zone = validate_storage_zone(&body.storage_zone)?;
    let input = rig_repo::CreateGearInput {
        name: validate_name(&body.name, "name")?,
        category: validate_name(&body.category, "category")?,
        weight_oz: body.weight_oz,
        storage_zone,
        notes: body
            .notes
            .map(|n| n.trim().to_string())
            .filter(|n| !n.is_empty()),
    };
    rig_repo::get_by_id_for_user(&state.db, rig_id, user.0).await?;
    let gear = rig_repo::create_gear(&state.db, rig_id, input).await?;
    Ok((StatusCode::CREATED, ok_envelope(gear, json!({}))))
}

pub async fn get_gear(
    State(state): State<AppState>,
    user: UserId,
    Path((rig_id, id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let gear = rig_repo::get_gear_by_id(&state.db, rig_id, id, user.0).await?;
    Ok(ok_envelope(gear, json!({})))
}

pub async fn update_gear(
    State(state): State<AppState>,
    user: UserId,
    Path((rig_id, id)): Path<(Uuid, Uuid)>,
    body: Result<Json<UpdateGearBody>, JsonRejection>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let Json(body) = body.map_err(map_json_rejection)?;
    let storage_zone = validate_storage_zone(&body.storage_zone)?;
    let input = rig_repo::UpdateGearInput {
        name: validate_name(&body.name, "name")?,
        category: validate_name(&body.category, "category")?,
        weight_oz: body.weight_oz,
        storage_zone,
        notes: body
            .notes
            .map(|n| n.trim().to_string())
            .filter(|n| !n.is_empty()),
    };
    let gear = rig_repo::update_gear(&state.db, rig_id, id, user.0, input).await?;
    Ok(ok_envelope(gear, json!({})))
}

pub async fn delete_gear(
    State(state): State<AppState>,
    user: UserId,
    Path((rig_id, id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    rig_repo::delete_gear(&state.db, rig_id, id, user.0).await?;
    Ok(ok_envelope(DeletedResponse { deleted: true }, json!({})))
}
