use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A planned or completed overland trip.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trip {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// An ordered segment within a trip (day 1, day 2, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TripLeg {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub seq: i32,
    pub name: Option<String>,
}

/// A named point of interest along a route.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Waypoint {
    pub id: Uuid,
    pub leg_id: Uuid,
    pub seq: i32,
    pub name: String,
    pub notes: Option<String>,
    // Geometry stored in PostGIS; lat/lon exposed on API responses via GeoJSON
    pub lat: f64,
    pub lon: f64,
}

/// A campsite — may be dispersed BLM, established, or stealth urban.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CampsiteType {
    Dispersed,
    Established,
    Stealth,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Campsite {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: String,
    pub campsite_type: CampsiteType,
    pub lat: f64,
    pub lon: f64,
    pub notes: Option<String>,
}
