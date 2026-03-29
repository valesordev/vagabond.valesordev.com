use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use vagabond_core::VagabondError;

/// Wrapper so we can implement [`IntoResponse`] for domain errors.
#[derive(Debug)]
pub struct ApiError(pub VagabondError);

impl From<VagabondError> for ApiError {
    fn from(e: VagabondError) -> Self { ApiError(e) }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self.0 {
            VagabondError::NotFound(msg)    => (StatusCode::NOT_FOUND, "NOT_FOUND", msg),
            VagabondError::Validation(msg)  => (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", msg),
            VagabondError::Unauthorized     => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "unauthorized".into()),
        };

        let body = Json(json!({
            "data": null,
            "meta": null,
            "error": {
                "code":    code,
                "message": message,
                "status":  status.as_u16()
            }
        }));

        (status, body).into_response()
    }
}
