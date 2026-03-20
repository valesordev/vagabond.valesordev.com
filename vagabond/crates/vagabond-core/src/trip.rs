use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::VagabondError;

/// Default page size for trip list endpoints.
pub const DEFAULT_TRIP_PAGE_SIZE: i64 = 50;
/// Maximum allowed `limit` for trip list endpoints.
pub const MAX_TRIP_PAGE_SIZE: i64 = 100;
/// Maximum length for `trips.name`.
pub const MAX_TRIP_NAME_LEN: usize = 256;
/// Maximum length for `trips.description`.
pub const MAX_TRIP_DESCRIPTION_LEN: usize = 8_000;

/// Validates a trip name (trimmed, non-empty, max length).
pub fn validate_trip_name(name: &str) -> Result<String, VagabondError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(VagabondError::Validation("trip name must not be empty".into()));
    }
    if trimmed.chars().count() > MAX_TRIP_NAME_LEN {
        return Err(VagabondError::Validation(format!(
            "trip name must be at most {MAX_TRIP_NAME_LEN} characters"
        )));
    }
    Ok(trimmed.to_string())
}

/// Validates optional description length (after trim); `None` stays `None`.
pub fn normalize_trip_description(description: Option<String>) -> Result<Option<String>, VagabondError> {
    match description {
        None => Ok(None),
        Some(s) => {
            let trimmed = s.trim();
            if trimmed.is_empty() {
                return Ok(None);
            }
            if trimmed.chars().count() > MAX_TRIP_DESCRIPTION_LEN {
                return Err(VagabondError::Validation(format!(
                    "trip description must be at most {MAX_TRIP_DESCRIPTION_LEN} characters"
                )));
            }
            Ok(Some(trimmed.to_string()))
        }
    }
}

/// Resolves `(limit, offset)` for paginated trip lists.
pub fn trip_list_pagination(limit: Option<i64>, offset: Option<i64>) -> Result<(i64, i64), VagabondError> {
    let limit = limit.unwrap_or(DEFAULT_TRIP_PAGE_SIZE);
    let offset = offset.unwrap_or(0);
    if !(1..=MAX_TRIP_PAGE_SIZE).contains(&limit) {
        return Err(VagabondError::Validation(format!(
            "limit must be between 1 and {MAX_TRIP_PAGE_SIZE}"
        )));
    }
    if offset < 0 {
        return Err(VagabondError::Validation("offset must be non-negative".into()));
    }
    Ok((limit, offset))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_trip_name_trims_and_ok() {
        assert_eq!(validate_trip_name("  Mojave  ").unwrap(), "Mojave");
    }

    #[test]
    fn validate_trip_name_rejects_empty() {
        assert!(validate_trip_name("   ").is_err());
        assert!(validate_trip_name("").is_err());
    }

    #[test]
    fn validate_trip_name_rejects_too_long() {
        let s = "x".repeat(MAX_TRIP_NAME_LEN + 1);
        assert!(validate_trip_name(&s).is_err());
    }

    #[test]
    fn normalize_description_empty_to_none() {
        assert_eq!(normalize_trip_description(Some("  ".into())).unwrap(), None);
    }

    #[test]
    fn normalize_description_trims() {
        assert_eq!(
            normalize_trip_description(Some("  notes  ".into())).unwrap(),
            Some("notes".into())
        );
    }

    #[test]
    fn pagination_defaults() {
        assert_eq!(trip_list_pagination(None, None).unwrap(), (DEFAULT_TRIP_PAGE_SIZE, 0));
    }

    #[test]
    fn pagination_limit_bounds() {
        assert!(trip_list_pagination(Some(0), None).is_err());
        assert!(trip_list_pagination(Some(MAX_TRIP_PAGE_SIZE + 1), None).is_err());
        assert!(trip_list_pagination(Some(-1), None).is_err());
    }

    #[test]
    fn pagination_offset_non_negative() {
        assert!(trip_list_pagination(Some(10), Some(-1)).is_err());
    }
}

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
