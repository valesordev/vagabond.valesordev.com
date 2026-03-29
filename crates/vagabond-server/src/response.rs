use axum::Json;
use serde::Serialize;
use serde_json::{json, Value};

/// JSON success envelope: `{ "data", "meta", "error": null }`.
pub fn ok_envelope<T: Serialize>(data: T, meta: Value) -> Json<Value> {
    Json(json!({
        "data": data,
        "meta": meta,
        "error": null
    }))
}
