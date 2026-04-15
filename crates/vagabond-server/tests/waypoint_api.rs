//! Integration tests for trip legs + waypoints (`/api/v1/trips/...`).
//! Requires Postgres:
//! `TEST_DATABASE_URL=postgres://... cargo test -p vagabond-server --test waypoint_api -- --ignored`
use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

fn test_config() -> vagabond_server::config::Config {
    vagabond_server::config::Config {
        database_url: "postgres://vagabond:vagabond@localhost:5432/vagabond".into(),
        db_max_connections: 10,
        listen_addr: "0.0.0.0:3001".into(),
        jwt_secret: "test-secret".into(),
        keycloak_issuer: Some("http://localhost:8080/realms/vagabond".into()),
        dev_auth: true,
    }
}

async fn test_pool() -> PgPool {
    let url = std::env::var("TEST_DATABASE_URL")
        .expect("TEST_DATABASE_URL must be set when running ignored waypoint_api tests");
    let pool = PgPool::connect(&url)
        .await
        .expect("connect TEST_DATABASE_URL");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("run migrations");
    pool
}

async fn insert_test_user(pool: &PgPool) -> Uuid {
    let sub = format!("sub-{}", Uuid::new_v4());
    let email = format!("{sub}@example.com");
    sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO users (keycloak_sub, email) VALUES ($1, $2) RETURNING id",
    )
    .bind(&sub)
    .bind(&email)
    .fetch_one(pool)
    .await
    .expect("insert test user")
}

fn parse_json_body(bytes: &[u8]) -> Value {
    serde_json::from_slice(bytes).expect("response json")
}

async fn create_trip(app: &axum::Router, user_id: Uuid, name: &str) -> Uuid {
    let req = Request::builder()
        .method("POST")
        .uri("/api/v1/trips")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(json!({ "name": name }).to_string()))
        .expect("build create trip request");
    let res = app
        .clone()
        .oneshot(req)
        .await
        .expect("create trip response");
    assert_eq!(res.status(), StatusCode::CREATED);
    let body = res
        .into_body()
        .collect()
        .await
        .expect("collect create trip body")
        .to_bytes();
    let value = parse_json_body(&body);
    let id = value["data"]["id"]
        .as_str()
        .expect("trip id string in response");
    Uuid::parse_str(id).expect("trip id uuid")
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn legs_and_waypoints_roundtrip_and_ordering() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id, "Mojave Loop").await;

    let create_leg_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(json!({ "name": "Day 1 Drive" }).to_string()))
        .expect("build create leg request");
    let create_leg_res = app
        .clone()
        .oneshot(create_leg_req)
        .await
        .expect("create leg response");
    assert_eq!(create_leg_res.status(), StatusCode::CREATED);
    let create_leg_body = create_leg_res
        .into_body()
        .collect()
        .await
        .expect("collect create leg body")
        .to_bytes();
    let create_leg_value = parse_json_body(&create_leg_body);
    let leg_id = Uuid::parse_str(
        create_leg_value["data"]["id"]
            .as_str()
            .expect("leg id string in response"),
    )
    .expect("leg id uuid");

    let create_wp_1_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs/{leg_id}/waypoints"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Baker Fuel",
                "notes": null,
                "lon": -116.0727,
                "lat": 35.2650
            })
            .to_string(),
        ))
        .expect("build create waypoint 1 request");
    let create_wp_1_res = app
        .clone()
        .oneshot(create_wp_1_req)
        .await
        .expect("create waypoint 1 response");
    assert_eq!(create_wp_1_res.status(), StatusCode::CREATED);

    let create_wp_2_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs/{leg_id}/waypoints"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Kelso Dunes Turnoff",
                "notes": "Photo stop",
                "lon": -115.6500,
                "lat": 34.9000
            })
            .to_string(),
        ))
        .expect("build create waypoint 2 request");
    let create_wp_2_res = app
        .clone()
        .oneshot(create_wp_2_req)
        .await
        .expect("create waypoint 2 response");
    assert_eq!(create_wp_2_res.status(), StatusCode::CREATED);

    let list_wp_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}/legs/{leg_id}/waypoints"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build list waypoint request");
    let list_wp_res = app
        .clone()
        .oneshot(list_wp_req)
        .await
        .expect("list waypoint response");
    assert_eq!(list_wp_res.status(), StatusCode::OK);
    let list_wp_body = list_wp_res
        .into_body()
        .collect()
        .await
        .expect("collect list waypoint body")
        .to_bytes();
    let list_wp_value = parse_json_body(&list_wp_body);
    assert_eq!(list_wp_value["meta"]["total"], 2);
    let waypoints = list_wp_value["data"]
        .as_array()
        .expect("waypoints array in response");
    assert_eq!(waypoints[0]["seq"], 1);
    assert_eq!(waypoints[0]["name"], "Baker Fuel");
    assert_eq!(waypoints[1]["seq"], 2);
    assert_eq!(waypoints[1]["name"], "Kelso Dunes Turnoff");
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn list_all_waypoints_returns_flat_ordered_rows() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id, "Sierra Legs").await;

    let create_leg_1_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(json!({ "name": "Leg 1" }).to_string()))
        .expect("build create leg 1 request");
    let create_leg_1_res = app
        .clone()
        .oneshot(create_leg_1_req)
        .await
        .expect("create leg 1 response");
    assert_eq!(create_leg_1_res.status(), StatusCode::CREATED);
    let leg_1_body = create_leg_1_res
        .into_body()
        .collect()
        .await
        .expect("collect create leg 1 body")
        .to_bytes();
    let leg_1_value = parse_json_body(&leg_1_body);
    let leg_1_id = Uuid::parse_str(leg_1_value["data"]["id"].as_str().expect("leg 1 id string"))
        .expect("leg 1 id uuid");

    let create_leg_2_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(json!({ "name": "Leg 2" }).to_string()))
        .expect("build create leg 2 request");
    let create_leg_2_res = app
        .clone()
        .oneshot(create_leg_2_req)
        .await
        .expect("create leg 2 response");
    assert_eq!(create_leg_2_res.status(), StatusCode::CREATED);
    let leg_2_body = create_leg_2_res
        .into_body()
        .collect()
        .await
        .expect("collect create leg 2 body")
        .to_bytes();
    let leg_2_value = parse_json_body(&leg_2_body);
    let leg_2_id = Uuid::parse_str(leg_2_value["data"]["id"].as_str().expect("leg 2 id string"))
        .expect("leg 2 id uuid");

    for (leg_id, name) in [
        (leg_2_id, "Leg2-Point1"),
        (leg_1_id, "Leg1-Point1"),
        (leg_1_id, "Leg1-Point2"),
    ] {
        let req = Request::builder()
            .method("POST")
            .uri(format!("/api/v1/trips/{trip_id}/legs/{leg_id}/waypoints"))
            .header("content-type", "application/json")
            .header("X-Vagabond-User-Id", user_id.to_string())
            .body(Body::from(
                json!({
                    "name": name,
                    "notes": null,
                    "lon": -118.0,
                    "lat": 37.0
                })
                .to_string(),
            ))
            .expect("build create waypoint request");
        let res = app
            .clone()
            .oneshot(req)
            .await
            .expect("create waypoint response");
        assert_eq!(res.status(), StatusCode::CREATED);
    }

    let req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}/waypoints"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build list all waypoints request");
    let res = app
        .clone()
        .oneshot(req)
        .await
        .expect("list all waypoints response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = res
        .into_body()
        .collect()
        .await
        .expect("collect list all waypoints body")
        .to_bytes();
    let value = parse_json_body(&body);
    let items = value["data"].as_array().expect("flat waypoints array");
    assert_eq!(value["meta"]["total"], 3);
    assert_eq!(items[0]["name"], "Leg1-Point1");
    assert_eq!(items[0]["leg_seq"], 1);
    assert_eq!(items[1]["name"], "Leg1-Point2");
    assert_eq!(items[1]["leg_seq"], 1);
    assert_eq!(items[2]["name"], "Leg2-Point1");
    assert_eq!(items[2]["leg_seq"], 2);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn delete_waypoint_removes_it_from_leg() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id, "Delete Waypoint").await;

    let create_leg_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(json!({ "name": "Leg Delete" }).to_string()))
        .expect("build create leg request");
    let create_leg_res = app
        .clone()
        .oneshot(create_leg_req)
        .await
        .expect("create leg response");
    assert_eq!(create_leg_res.status(), StatusCode::CREATED);
    let leg_body = create_leg_res
        .into_body()
        .collect()
        .await
        .expect("collect create leg body")
        .to_bytes();
    let leg_value = parse_json_body(&leg_body);
    let leg_id = Uuid::parse_str(leg_value["data"]["id"].as_str().expect("leg id string"))
        .expect("leg id uuid");

    let create_wp_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs/{leg_id}/waypoints"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Delete Me",
                "notes": null,
                "lon": -117.0,
                "lat": 36.0
            })
            .to_string(),
        ))
        .expect("build create waypoint request");
    let create_wp_res = app
        .clone()
        .oneshot(create_wp_req)
        .await
        .expect("create waypoint response");
    assert_eq!(create_wp_res.status(), StatusCode::CREATED);
    let wp_body = create_wp_res
        .into_body()
        .collect()
        .await
        .expect("collect create waypoint body")
        .to_bytes();
    let wp_value = parse_json_body(&wp_body);
    let waypoint_id = Uuid::parse_str(wp_value["data"]["id"].as_str().expect("waypoint id string"))
        .expect("waypoint id uuid");

    let delete_req = Request::builder()
        .method("DELETE")
        .uri(format!(
            "/api/v1/trips/{trip_id}/legs/{leg_id}/waypoints/{waypoint_id}"
        ))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build delete waypoint request");
    let delete_res = app
        .clone()
        .oneshot(delete_req)
        .await
        .expect("delete waypoint response");
    assert_eq!(delete_res.status(), StatusCode::OK);

    let list_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}/legs/{leg_id}/waypoints"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build list waypoints request");
    let list_res = app
        .clone()
        .oneshot(list_req)
        .await
        .expect("list waypoints response");
    assert_eq!(list_res.status(), StatusCode::OK);
    let body = list_res
        .into_body()
        .collect()
        .await
        .expect("collect list waypoints body")
        .to_bytes();
    let value = parse_json_body(&body);
    assert_eq!(value["meta"]["total"], 0);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn cross_user_cannot_add_leg_to_another_users_trip() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let owner = insert_test_user(&pool).await;
    let stranger = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, owner, "Private Trip").await;

    let req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/legs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::from(json!({ "name": "Should Fail" }).to_string()))
        .expect("build create leg request");
    let res = app.oneshot(req).await.expect("create leg response");
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}
