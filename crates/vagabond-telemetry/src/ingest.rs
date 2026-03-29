use sqlx::PgPool;
use vagabond_core::VagabondError;

use crate::model::TelemetryPoint;

/// Parse an OTLP JSON payload from Alloy and return structured telemetry points.
/// Full OTLP proto/JSON parsing to be implemented in v0.2.
pub fn parse_otlp_payload(_raw: &[u8]) -> Result<Vec<TelemetryPoint>, VagabondError> {
    // TODO: parse OTLP ExportTraceServiceRequest or metrics payload
    // For now, accept a simplified JSON array of TelemetryPoints directly
    Ok(vec![])
}

/// Bulk-insert parsed telemetry points into PostGIS.
pub async fn insert_points(
    pool: &PgPool,
    points: &[TelemetryPoint],
) -> Result<u64, VagabondError> {
    // TODO: implement bulk insert via UNNEST for efficiency
    let _ = pool;
    let _ = points;
    Ok(0)
}
