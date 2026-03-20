use axum::{extract::State, http::StatusCode, Json};
use serde_json::{json, Value};

use crate::state::AppState;

pub async fn handler(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    // Basic DB reachability check
    let db_ok = sqlx::query("SELECT 1").fetch_one(&state.db).await.is_ok();

    let status = if db_ok { StatusCode::OK } else { StatusCode::SERVICE_UNAVAILABLE };
    let body = json!({
        "status": if db_ok { "ok" } else { "degraded" },
        "db":     if db_ok { "ok" } else { "unreachable" },
    });

    (status, Json(body))
}
