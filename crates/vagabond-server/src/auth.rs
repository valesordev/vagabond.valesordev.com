use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use tokio::sync::RwLock;
use tracing::warn;
use uuid::Uuid;

/// Resolved caller identity after JWT validation (or dev header).
#[derive(Debug, Clone)]
pub struct AuthIdentity {
    pub user_id: Uuid,
    pub keycloak_sub: String,
    pub email: String,
}

#[derive(Clone)]
pub struct AuthState {
    issuer: Option<String>,
    jwks_url: Option<String>,
    dev_auth: bool,
    jwks: Arc<RwLock<HashMap<String, DecodingKey>>>,
}

impl AuthState {
    pub fn new(issuer: Option<String>, jwks_url: Option<String>, dev_auth: bool) -> Self {
        Self {
            issuer,
            jwks_url,
            dev_auth,
            jwks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn issuer(&self) -> Option<&str> {
        self.issuer.as_deref()
    }

    pub fn dev_auth_enabled(&self) -> bool {
        self.dev_auth
    }

    pub async fn insert_test_key(&self, kid: impl Into<String>, key: DecodingKey) {
        self.jwks.write().await.insert(kid.into(), key);
    }

    pub async fn validate_bearer_token(&self, token: &str) -> Result<AuthIdentity, AuthError> {
        let issuer = self.issuer.as_deref().ok_or(AuthError::JwksUnavailable)?;
        let header = decode_header(token).map_err(|_| AuthError::InvalidToken)?;
        let kid = header.kid.ok_or(AuthError::InvalidToken)?;
        let alg = header.alg;
        if alg != Algorithm::RS256 {
            return Err(AuthError::InvalidToken);
        }
        let keys = self.jwks.read().await;
        if keys.is_empty() {
            return Err(AuthError::JwksUnavailable);
        }
        let key = keys.get(&kid).ok_or(AuthError::InvalidToken)?;
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[issuer]);
        let claims =
            decode::<JwtClaims>(token, key, &validation).map_err(|_| AuthError::InvalidToken)?;
        let _ = (&claims.claims.iss, claims.claims.exp);
        let keycloak_sub = claims.claims.sub;
        let user_id = Uuid::parse_str(&keycloak_sub).map_err(|_| AuthError::InvalidToken)?;
        let email = claims
            .claims
            .email
            .filter(|e| !e.trim().is_empty())
            .unwrap_or_else(|| format!("{user_id}@users.vagabond.local"));
        Ok(AuthIdentity {
            user_id,
            keycloak_sub,
            email,
        })
    }
}

#[derive(Debug, Deserialize)]
struct JwtClaims {
    sub: String,
    iss: String,
    exp: usize,
    #[serde(default)]
    email: Option<String>,
}

#[derive(Debug, Deserialize)]
struct JwksResponse {
    keys: Vec<JwkKey>,
}

#[derive(Debug, Deserialize)]
struct JwkKey {
    kid: Option<String>,
    kty: String,
    n: Option<String>,
    e: Option<String>,
}

#[derive(Debug)]
pub enum AuthError {
    InvalidToken,
    JwksUnavailable,
}

pub async fn bootstrap_jwks(auth: AuthState) {
    if auth.issuer().is_none() {
        warn!("KEYCLOAK_ISSUER is not set; JWT validation will remain unavailable");
        return;
    }

    if let Err(err) = refresh_jwks(&auth).await {
        warn!("failed to fetch Keycloak JWKS on startup: {err}");
    }

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(300)).await;
            if let Err(err) = refresh_jwks(&auth).await {
                warn!("failed to refresh Keycloak JWKS: {err}");
            }
        }
    });
}

async fn refresh_jwks(auth: &AuthState) -> anyhow::Result<()> {
    let url = if let Some(jwks_url) = auth.jwks_url.as_deref() {
        jwks_url.to_owned()
    } else {
        let issuer = auth
            .issuer()
            .ok_or_else(|| anyhow::anyhow!("issuer is not configured"))?;
        format!("{issuer}/protocol/openid-connect/certs")
    };
    let jwks = reqwest::Client::new()
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json::<JwksResponse>()
        .await?;

    let mut next = HashMap::new();
    for key in jwks.keys {
        if key.kty != "RSA" {
            continue;
        }
        let (Some(kid), Some(n), Some(e)) = (key.kid, key.n, key.e) else {
            continue;
        };
        let decoding = DecodingKey::from_rsa_components(&n, &e)?;
        next.insert(kid, decoding);
    }

    if next.is_empty() {
        anyhow::bail!("JWKS endpoint returned no usable RSA keys");
    }

    *auth.jwks.write().await = next;
    Ok(())
}
