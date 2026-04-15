use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A per-trip daily field journal entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldLog {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub user_id: Uuid,
    pub log_date: NaiveDate,
    pub notes: Option<String>,
    pub actual_power_consumed_wh: Option<f64>,
    pub actual_water_consumed_gal: Option<f64>,
    pub actual_weather: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
