//! Vagabond HTTP API server library surface (router + shared modules).

use axum::http::{header::HeaderValue, Method};
use axum::{routing::get, Router};
use axum_prometheus::{Handle, PrometheusMetricLayer};
use sqlx::PgPool;
use std::env;
use std::sync::OnceLock;
use tower_http::cors::{Any, CorsLayer};

static PROMETHEUS_HANDLE: OnceLock<Handle> = OnceLock::new();

pub mod auth;
pub mod config;
pub mod error;
pub mod extractors;
pub mod repository;
pub mod response;
pub mod routes;
pub mod state;

use state::AppState;

/// Builds the full application router (health + `/api/v1`) with database state.
pub async fn build_app(db: PgPool, cfg: &config::Config) -> Router {
    let auth = auth::AuthState::new(
        cfg.keycloak_issuer.clone(),
        cfg.keycloak_jwks_url.clone(),
        cfg.dev_auth,
    );
    auth::bootstrap_jwks(auth.clone()).await;
    let state = AppState::new(db, auth);
    // PrometheusMetricLayer::pair() registers the global recorder and panics if called twice.
    // Use the OnceLock so the recorder is only registered once, even across multiple build_app
    // calls in integration tests.
    let (prometheus_layer, metric_handle) = if PROMETHEUS_HANDLE.get().is_none() {
        let (layer, handle) = PrometheusMetricLayer::pair();
        let handle = PROMETHEUS_HANDLE
            .get_or_init(|| axum_prometheus::Handle(handle))
            .clone();
        (layer, handle)
    } else {
        let handle = PROMETHEUS_HANDLE.get().unwrap().clone();
        (PrometheusMetricLayer::new(), handle)
    };
    let cors_origins = env::var("CORS_ALLOW_ORIGINS")
        .ok()
        .map(|value| {
            value
                .split(',')
                .map(str::trim)
                .filter(|origin| !origin.is_empty())
                .map(ToOwned::to_owned)
                .collect::<Vec<String>>()
        })
        .filter(|origins| !origins.is_empty())
        .unwrap_or_else(|| {
            vec![
                "http://localhost:3000".to_string(),
                "http://127.0.0.1:3000".to_string(),
            ]
        });
    let allowed_origins = cors_origins
        .iter()
        .filter_map(|origin| HeaderValue::from_str(origin).ok())
        .collect::<Vec<HeaderValue>>();
    let cors_layer = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any)
        .allow_origin(allowed_origins);
    let metrics_router =
        Router::new().route("/metrics", get(|| async move { metric_handle.0.render() }));
    Router::new()
        .route("/health", get(routes::health::handler))
        .nest("/api/v1", routes::v1::router())
        .merge(metrics_router)
        .layer(cors_layer)
        .layer(prometheus_layer)
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use sqlx::postgres::PgPoolOptions;
    use tower::ServiceExt;

    const TEST_ISSUER: &str = "http://localhost:8080/realms/vagabond";

    #[tokio::test]
    async fn metrics_endpoint_returns_prometheus_payload() {
        let cfg = config::Config {
            database_url: "postgres://vagabond:vagabond@localhost:5432/vagabond".into(),
            db_max_connections: 10,
            listen_addr: "0.0.0.0:3001".into(),
            jwt_secret: "test-secret".into(),
            keycloak_issuer: Some(TEST_ISSUER.into()),
            keycloak_jwks_url: None,
            dev_auth: false,
        };
        let pool = PgPoolOptions::new()
            .connect_lazy("postgres://vagabond:vagabond@localhost:5432/vagabond")
            .expect("build lazy pool");
        let app = build_app(pool, &cfg).await;

        let req = Request::builder()
            .uri("/metrics")
            .body(Body::empty())
            .expect("build request");
        let res = app.oneshot(req).await.expect("serve /metrics");
        assert_eq!(res.status(), StatusCode::OK);

        let body = res
            .into_body()
            .collect()
            .await
            .expect("read response body")
            .to_bytes();
        let payload = String::from_utf8_lossy(&body);
        assert!(
            payload.contains("# TYPE"),
            "expected Prometheus exposition format in response body"
        );
    }
}
