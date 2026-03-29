use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use uuid::Uuid;
use vagabond_core::VagabondError;

use crate::error::ApiError;

/// Authenticated (or dev) caller identity from `X-Vagabond-User-Id` until Keycloak is wired.
#[derive(Debug, Clone, Copy)]
pub struct UserId(pub Uuid);

impl<S> FromRequestParts<S> for UserId
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let raw = parts
            .headers
            .get("X-Vagabond-User-Id")
            .ok_or_else(|| ApiError(VagabondError::Unauthorized))?;
        let s = raw
            .to_str()
            .map_err(|_| ApiError(VagabondError::Validation("invalid X-Vagabond-User-Id header".into())))?;
        let id = Uuid::parse_str(s)
            .map_err(|_| ApiError(VagabondError::Validation("X-Vagabond-User-Id must be a UUID".into())))?;
        Ok(UserId(id))
    }
}
