use crate::state::AppState;
use axum::{routing::get, Router};

mod rigs;
mod telemetry;
mod trip_events;
mod trips;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/trips", get(trips::list).post(trips::create))
        .route(
            "/trips/:id",
            get(trips::get).put(trips::update).delete(trips::delete),
        )
        .route(
            "/trips/:trip_id/legs",
            get(trips::list_legs).post(trips::create_leg),
        )
        .route(
            "/trips/:trip_id/legs/:leg_id/waypoints",
            get(trips::list_waypoints).post(trips::create_waypoint),
        )
        .route(
            "/trips/:trip_id/legs/:leg_id/waypoints/:id",
            axum::routing::put(trips::update_waypoint).delete(trips::delete_waypoint),
        )
        .route("/trips/:trip_id/waypoints", get(trips::list_all_waypoints))
        .route(
            "/trips/:trip_id/import/gpx",
            axum::routing::post(trips::import_gpx),
        )
        .route(
            "/trips/:trip_id/logs",
            get(trips::list_logs).post(trips::create_log),
        )
        .route(
            "/trips/:trip_id/logs/:date",
            get(trips::get_log)
                .put(trips::upsert_log)
                .delete(trips::delete_log),
        )
        .route("/rigs", get(rigs::list).post(rigs::create))
        .route(
            "/rigs/:rig_id",
            get(rigs::get).put(rigs::update).delete(rigs::delete),
        )
        .route(
            "/rigs/:rig_id/gear",
            get(rigs::list_gear).post(rigs::create_gear),
        )
        .route(
            "/rigs/:rig_id/gear/:id",
            get(rigs::get_gear)
                .put(rigs::update_gear)
                .delete(rigs::delete_gear),
        )
        .route(
            "/trips/:trip_id/events",
            get(trip_events::list).post(trip_events::create),
        )
        .route(
            "/trips/:trip_id/events/:event_id",
            get(trip_events::get)
                .put(trip_events::update)
                .delete(trip_events::delete),
        )
        .route("/telemetry/ingest", axum::routing::post(telemetry::ingest))
}
