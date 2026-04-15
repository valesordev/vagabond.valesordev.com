use axum::extract::FromRequestParts;
use axum::http::header::AUTHORIZATION;
use axum::http::request::Parts;
use uuid::Uuid;
use vagabond_core::VagabondError;

use crate::auth::AuthError;
use crate::error::ApiError;
use crate::state::AppState;

/// Authenticated caller identity from OIDC JWT (`Authorization: Bearer ...`).
/// In local development, `VAGABOND_DEV_AUTH=true` enables `X-Vagabond-User-Id` fallback.
#[derive(Debug, Clone, Copy)]
pub struct UserId(pub Uuid);

#[axum::async_trait]
impl FromRequestParts<AppState> for UserId {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        if state.auth.dev_auth_enabled() {
            if let Some(raw) = parts.headers.get("X-Vagabond-User-Id") {
                let s = raw.to_str().map_err(|_| {
                    ApiError::from(VagabondError::Validation(
                        "invalid X-Vagabond-User-Id header".into(),
                    ))
                })?;
                let id = Uuid::parse_str(s).map_err(|_| {
                    ApiError::from(VagabondError::Validation(
                        "X-Vagabond-User-Id must be a UUID".into(),
                    ))
                })?;
                return Ok(UserId(id));
            }
        }

        let authz = parts
            .headers
            .get(AUTHORIZATION)
            .ok_or_else(ApiError::missing_token)?;
        let authz = authz.to_str().map_err(|_| ApiError::invalid_token())?;
        let token = authz
            .strip_prefix("Bearer ")
            .ok_or_else(ApiError::missing_token)?;
        let user_id = state
            .auth
            .validate_bearer_token(token)
            .await
            .map_err(|err| match err {
                AuthError::InvalidToken => ApiError::invalid_token(),
                AuthError::JwksUnavailable => ApiError::auth_unavailable(),
            })?;

        Ok(UserId(user_id))
    }
}
