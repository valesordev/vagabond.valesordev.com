use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use vagabond_core::VagabondError;

/// Wrapper so we can implement [`IntoResponse`] for domain errors.
#[derive(Debug)]
pub struct ApiError {
    status: StatusCode,
    code: &'static str,
    message: String,
}

impl From<VagabondError> for ApiError {
    fn from(e: VagabondError) -> Self {
        match e {
            VagabondError::NotFound(msg) => Self::new(StatusCode::NOT_FOUND, "NOT_FOUND", msg),
            VagabondError::Validation(msg) => {
                Self::new(StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", msg)
            }
            VagabondError::Unauthorized => {
                Self::new(StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "unauthorized")
            }
        }
    }
}

impl ApiError {
    pub fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> Self {
        Self {
            status,
            code,
            message: message.into(),
        }
    }

    pub fn missing_token() -> Self {
        Self::new(
            StatusCode::UNAUTHORIZED,
            "MISSING_TOKEN",
            "missing bearer token",
        )
    }

    pub fn invalid_token() -> Self {
        Self::new(StatusCode::UNAUTHORIZED, "INVALID_TOKEN", "invalid token")
    }

    pub fn auth_unavailable() -> Self {
        Self::new(
            StatusCode::SERVICE_UNAVAILABLE,
            "AUTH_UNAVAILABLE",
            "authentication service unavailable",
        )
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = Json(json!({
            "data": null,
            "meta": null,
            "error": {
                "code":    self.code,
                "message": self.message,
                "status":  self.status.as_u16()
            }
        }));

        (self.status, body).into_response()
    }
}
