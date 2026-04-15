//! Integration tests for `/api/v1/trips/:trip_id/import/gpx`.
//! Requires Postgres:
//! `TEST_DATABASE_URL=postgres://... cargo test -p vagabond-server --test gpx_import -- --ignored`

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

const MINIMAL_GPX: &str = r#"<?xml version="1.0"?>
<gpx version="1.1" creator="test">
  <metadata>
    <name>Kelso Dunes Loop</name>
  </metadata>
  <wpt lat="35.26" lon="-116.07"><name>Baker</name></wpt>
  <wpt lat="35.40" lon="-115.94"><name>Kelso Dunes TH</name></wpt>
  <rte>
    <name>Kelbaker Road</name>
    <rtept lat="35.26" lon="-116.07"/>
    <rtept lat="35.40" lon="-115.94"/>
  </rte>
</gpx>"#;

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
        .expect("TEST_DATABASE_URL must be set when running ignored gpx_import tests");
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

fn multipart_body(boundary: &str, file_name: Option<&str>, content: &str) -> String {
    match file_name {
        Some(name) => format!(
            "--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\nContent-Type: application/gpx+xml\r\n\r\n{content}\r\n--{boundary}--\r\n"
        ),
        None => format!(
            "--{boundary}\r\nContent-Disposition: form-data; name=\"not_file\"\r\n\r\n{content}\r\n--{boundary}--\r\n"
        ),
    }
}

async fn create_trip(app: &axum::Router, user_id: Uuid) -> Uuid {
    let req = Request::builder()
        .method("POST")
        .uri("/api/v1/trips")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(json!({ "name": "Mojave Route" }).to_string()))
        .expect("build create trip req");
    let res = app.clone().oneshot(req).await.expect("trip create request");
    assert_eq!(res.status(), StatusCode::CREATED);
    let v = parse_json_body(
        res.into_body()
            .collect()
            .await
            .expect("collect body")
            .to_bytes()
            .as_ref(),
    );
    Uuid::parse_str(v["data"]["id"].as_str().expect("trip id")).expect("trip id is uuid")
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn imports_gpx_file_into_leg_waypoints_and_route() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id).await;

    let boundary = "gpx-test-boundary";
    let req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/import/gpx"))
        .header(
            "content-type",
            format!("multipart/form-data; boundary={boundary}"),
        )
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(multipart_body(
            boundary,
            Some("import.gpx"),
            MINIMAL_GPX,
        )))
        .expect("build import request");
    let res = app.clone().oneshot(req).await.expect("import request");
    assert_eq!(res.status(), StatusCode::CREATED);

    let body = res
        .into_body()
        .collect()
        .await
        .expect("collect body")
        .to_bytes();
    let v = parse_json_body(&body);
    assert_eq!(v["error"], Value::Null);
    assert_eq!(v["data"]["leg_name"], "Kelso Dunes Loop");
    assert_eq!(v["data"]["waypoints_imported"], 2);
    assert_eq!(v["data"]["routes_imported"], 1);

    let leg_id =
        Uuid::parse_str(v["data"]["leg_id"].as_str().expect("leg id")).expect("leg id is uuid");
    let waypoint_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM waypoints WHERE leg_id = $1")
            .bind(leg_id)
            .fetch_one(&pool)
            .await
            .expect("count waypoints");
    let route_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM routes WHERE leg_id = $1")
            .bind(leg_id)
            .fetch_one(&pool)
            .await
            .expect("count routes");
    assert_eq!(waypoint_count, 2);
    assert_eq!(route_count, 1);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn returns_unprocessable_entity_for_invalid_gpx() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id).await;

    let boundary = "bad-gpx-boundary";
    let req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/import/gpx"))
        .header(
            "content-type",
            format!("multipart/form-data; boundary={boundary}"),
        )
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(multipart_body(
            boundary,
            Some("broken.gpx"),
            "<gpx><wpt></gpx",
        )))
        .expect("build import request");
    let res = app.oneshot(req).await.expect("import request");
    assert_eq!(res.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let v = parse_json_body(
        res.into_body()
            .collect()
            .await
            .expect("collect body")
            .to_bytes()
            .as_ref(),
    );
    assert_eq!(v["error"]["code"], "INVALID_GPX");
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn returns_bad_request_when_file_field_missing() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id).await;

    let boundary = "missing-file-boundary";
    let req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/import/gpx"))
        .header(
            "content-type",
            format!("multipart/form-data; boundary={boundary}"),
        )
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(multipart_body(boundary, None, "no file here")))
        .expect("build import request");
    let res = app.oneshot(req).await.expect("import request");
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let v = parse_json_body(
        res.into_body()
            .collect()
            .await
            .expect("collect body")
            .to_bytes()
            .as_ref(),
    );
    assert_eq!(v["error"]["code"], "MISSING_FILE");
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn returns_not_found_for_unowned_trip() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let owner = insert_test_user(&pool).await;
    let stranger = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, owner).await;

    let boundary = "wrong-owner-boundary";
    let req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/import/gpx"))
        .header(
            "content-type",
            format!("multipart/form-data; boundary={boundary}"),
        )
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::from(multipart_body(
            boundary,
            Some("import.gpx"),
            MINIMAL_GPX,
        )))
        .expect("build import request");
    let res = app.oneshot(req).await.expect("import request");
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}
