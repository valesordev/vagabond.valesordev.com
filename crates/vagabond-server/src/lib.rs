//! Vagabond HTTP API server library surface (router + shared modules).

use axum::{routing::get, Router};
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
pub fn build_app(db: PgPool) -> Router<AppState> {
    let state = AppState::new(db);
    Router::new()
        .route("/health", get(routes::health::handler))
        .nest("/api/v1", routes::v1::router())
        .with_state(state)
}
