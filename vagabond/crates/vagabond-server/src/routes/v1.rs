use axum::{routing::get, Router};
use crate::state::AppState;

mod trips;
mod gear;
mod telemetry;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/trips",           get(trips::list).post(trips::create))
        .route("/trips/:id",       get(trips::get).put(trips::update).delete(trips::delete))
        .route("/trips/:id/legs",  get(trips::list_legs).post(trips::create_leg))
        .route("/gear",            get(gear::list).post(gear::create))
        .route("/gear/:id",        get(gear::get).put(gear::update).delete(gear::delete))
        .route("/telemetry/ingest", axum::routing::post(telemetry::ingest))
}
