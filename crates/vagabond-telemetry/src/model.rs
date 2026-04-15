use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Parsed representation of a single telemetry point from the Alloy agent.
/// OTLP payload → this struct → PostGIS insert.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryPoint {
    pub session_id: Uuid,
    pub recorded_at: DateTime<Utc>,
    pub lat: f64,
    pub lon: f64,
    pub altitude_m: Option<f64>,
    pub speed_kph: Option<f64>,
    pub heading_deg: Option<f64>,
    pub battery_pct: Option<f64>,
    pub solar_w: Option<f64>,
}
