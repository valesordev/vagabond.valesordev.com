use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Sub-type enums ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StopType {
    RestArea,
    Meal,
    Coffee,
    Scenic,
    Other,
}

/// Actual overnight stay type (broader than planned CampsiteType — includes non-camping nights).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StayType {
    Dispersed,
    Established,
    Stealth,
    Hotel,
    RvPark,
    FriendFamily,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IssueSeverity {
    Low,
    Medium,
    High,
}

// ── Typed payload per event_type ──────────────────────────────────────────────

/// Structured metadata for each event type.
/// Serialises with an embedded `"type"` discriminant (serde internally-tagged).
/// Unknown variants round-trip through the JSON layer without error.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EventPayload {
    TripStart {
        odometer_miles: Option<f64>,
    },
    TripEnd {
        odometer_miles: Option<f64>,
    },
    FuelFill {
        gallons: f64,
        price_per_gallon: Option<f64>,
        odometer_miles: Option<f64>,
    },
    WaterFill {
        gallons: f64,
        source: Option<String>,
    },
    Stop {
        stop_type: StopType,
        duration_minutes: Option<u32>,
    },
    Campsite {
        stay_type: StayType,
        nights: Option<u32>,
    },
    Hike {
        trail_name: Option<String>,
        distance_miles: Option<f64>,
        elevation_gain_ft: Option<f64>,
    },
    VehicleIssue {
        severity: IssueSeverity,
        description: String,
    },
    Note {},
}

impl EventPayload {
    pub fn event_type(&self) -> &'static str {
        match self {
            EventPayload::TripStart { .. } => "trip_start",
            EventPayload::TripEnd { .. } => "trip_end",
            EventPayload::FuelFill { .. } => "fuel_fill",
            EventPayload::WaterFill { .. } => "water_fill",
            EventPayload::Stop { .. } => "stop",
            EventPayload::Campsite { .. } => "campsite",
            EventPayload::Hike { .. } => "hike",
            EventPayload::VehicleIssue { .. } => "vehicle_issue",
            EventPayload::Note {} => "note",
        }
    }
}

// ── Domain type ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TripEvent {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub user_id: Uuid,
    pub event_type: String,
    pub occurred_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    /// WGS-84 longitude — present when the event has a GPS pin.
    pub lon: Option<f64>,
    /// WGS-84 latitude — present when the event has a GPS pin.
    pub lat: Option<f64>,
    pub notes: Option<String>,
    /// Typed payload deserialized from JSONB. `None` if the stored type is unknown
    /// to this version of the schema (forward-compatibility).
    pub payload: Option<EventPayload>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn event_payload_type_matches_variant() {
        let p = EventPayload::FuelFill {
            gallons: 15.3,
            price_per_gallon: Some(3.89),
            odometer_miles: Some(23456.0),
        };
        assert_eq!(p.event_type(), "fuel_fill");
    }

    #[test]
    fn event_payload_roundtrips_via_serde_json() {
        let p = EventPayload::Hike {
            trail_name: Some("Oak Creek Canyon".into()),
            distance_miles: Some(4.2),
            elevation_gain_ft: Some(800.0),
        };
        let json = serde_json::to_string(&p).expect("serialize");
        let back: EventPayload = serde_json::from_str(&json).expect("deserialize");
        assert_eq!(back.event_type(), "hike");
    }
}
