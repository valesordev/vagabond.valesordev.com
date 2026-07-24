use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A vehicle profile — specs, power system, cargo capacity.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rig {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub make: String,
    pub model: String,
    pub year: i32,
    pub fuel_capacity_gal: Option<f64>,
    pub battery_capacity_wh: Option<f64>,
    pub solar_peak_watts: Option<f64>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// A single item in the rig's gear inventory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GearItem {
    pub id: Uuid,
    pub rig_id: Uuid,
    pub name: String,
    pub category: String,
    pub weight_oz: Option<f64>,
    pub storage_zone: StorageZone,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StorageZone {
    RearCargo,
    CargoCarrier,
    Cab,
    Rooftop,
    Other,
}
