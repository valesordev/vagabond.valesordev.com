//! Vagabond HTTP API server library surface (router + shared modules).

use axum::{routing::get, Router};
use axum_prometheus::PrometheusMetricLayer;
use sqlx::PgPool;

pub mod config;
pub mod error;
pub mod extractors;
pub mod repository;
pub mod response;
pub mod routes;
pub mod state;

use state::AppState;

/// Builds the full application router (health + `/api/v1`) with database state.
pub fn build_app(db: PgPool) -> Router {
    let state = AppState::new(db);
    let (prometheus_layer, metric_handle) = PrometheusMetricLayer::pair();
    let metrics_router = Router::new().route(
        "/metrics",
        get(|| async move { metric_handle.render() }),
    );
    Router::new()
        .route("/health", get(routes::health::handler))
        .nest("/api/v1", routes::v1::router())
        .merge(metrics_router)
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

    #[tokio::test]
    async fn metrics_endpoint_returns_prometheus_payload() {
        let pool = PgPoolOptions::new()
            .connect_lazy("postgres://vagabond:vagabond@localhost:5432/vagabond")
            .expect("build lazy pool");
        let app = build_app(pool);

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
