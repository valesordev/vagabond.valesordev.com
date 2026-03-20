use anyhow::Context;
use axum::{routing::get, Router};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod config;
mod error;
mod routes;
mod state;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ── Observability ────────────────────────────────────────────────────────
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // ── Config ───────────────────────────────────────────────────────────────
    dotenvy::dotenv().ok();
    let cfg = config::Config::from_env().context("failed to load config")?;

    // ── Database ─────────────────────────────────────────────────────────────
    info!("connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(cfg.db_max_connections)
        .connect(&cfg.database_url)
        .await
        .context("failed to connect to database")?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .context("failed to run migrations")?;

    info!("migrations applied");

    // ── App state ────────────────────────────────────────────────────────────
    let state = AppState::new(pool);

    // ── Router ───────────────────────────────────────────────────────────────
    let app = Router::new()
        .route("/health", get(routes::health::handler))
        .nest("/api/v1", routes::v1::router())
        .with_state(state);

    // ── Serve ────────────────────────────────────────────────────────────────
    let addr: SocketAddr = cfg.listen_addr.parse().context("invalid listen address")?;
    info!("vagabond-server listening on {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
