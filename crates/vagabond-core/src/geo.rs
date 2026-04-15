/// Thin GeoJSON-compatible types for API wire format (RFC 7946).
/// Actual spatial operations go through PostGIS — never computed here.
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoPoint {
    #[serde(rename = "type")]
    pub kind: PointType,
    pub coordinates: [f64; 2], // [lon, lat] — GeoJSON order
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PointType {
    Point,
}

impl GeoPoint {
    pub fn new(lon: f64, lat: f64) -> Self {
        Self {
            kind: PointType::Point,
            coordinates: [lon, lat],
        }
    }

    pub fn lon(&self) -> f64 {
        self.coordinates[0]
    }
    pub fn lat(&self) -> f64 {
        self.coordinates[1]
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoLineString {
    #[serde(rename = "type")]
    pub kind: LineStringType,
    pub coordinates: Vec<[f64; 2]>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LineStringType {
    LineString,
}
