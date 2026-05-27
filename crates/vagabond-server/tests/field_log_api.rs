//! Integration tests for trip field logs (`/api/v1/trips/:trip_id/logs`).
//! Requires Postgres:
//! `TEST_DATABASE_URL=postgres://... cargo test -p vagabond-server --test field_log_api -- --ignored`

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
        keycloak_jwks_url: None,
        dev_auth: true,
    }
}

async fn test_pool() -> PgPool {
    let url = std::env::var("TEST_DATABASE_URL")
        .expect("TEST_DATABASE_URL must be set when running ignored field_log_api tests");
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
async fn create_get_upsert_and_list_logs_roundtrip() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id, "Mojave Journal").await;

    let create_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/logs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "log_date": "2026-04-08",
                "notes": "Wind picked up in the afternoon.",
                "actual_power_consumed_wh": 1840.0,
                "actual_water_consumed_gal": 1.75,
                "actual_weather": "Clear"
            })
            .to_string(),
        ))
        .expect("build create log request");
    let create_res = app
        .clone()
        .oneshot(create_req)
        .await
        .expect("create log response");
    assert_eq!(create_res.status(), StatusCode::CREATED);
    let create_body = create_res
        .into_body()
        .collect()
        .await
        .expect("collect create log body")
        .to_bytes();
    let create_value = parse_json_body(&create_body);
    assert_eq!(create_value["data"]["log_date"], "2026-04-08");
    assert_eq!(
        create_value["data"]["notes"],
        "Wind picked up in the afternoon."
    );

    let duplicate_create_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/logs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "log_date": "2026-04-08",
                "notes": "Duplicate"
            })
            .to_string(),
        ))
        .expect("build duplicate create request");
    let duplicate_create_res = app
        .clone()
        .oneshot(duplicate_create_req)
        .await
        .expect("duplicate create response");
    assert_eq!(duplicate_create_res.status(), StatusCode::CONFLICT);
    let duplicate_body = duplicate_create_res
        .into_body()
        .collect()
        .await
        .expect("collect duplicate body")
        .to_bytes();
    let duplicate_value = parse_json_body(&duplicate_body);
    assert_eq!(duplicate_value["error"]["code"], "LOG_DATE_CONFLICT");

    let get_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}/logs/2026-04-08"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build get log request");
    let get_res = app
        .clone()
        .oneshot(get_req)
        .await
        .expect("get log response");
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_body = get_res
        .into_body()
        .collect()
        .await
        .expect("collect get log body")
        .to_bytes();
    let get_value = parse_json_body(&get_body);
    let original_updated_at = get_value["data"]["updated_at"]
        .as_str()
        .expect("updated_at in get response")
        .to_string();

    tokio::time::sleep(std::time::Duration::from_millis(1100)).await;
    let upsert_req = Request::builder()
        .method("PUT")
        .uri(format!("/api/v1/trips/{trip_id}/logs/2026-04-08"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "log_date": "2026-04-08",
                "notes": "Updated notes after evening check.",
                "actual_power_consumed_wh": 1925.5,
                "actual_water_consumed_gal": 1.90,
                "actual_weather": "Clear, windy after 2pm"
            })
            .to_string(),
        ))
        .expect("build upsert request");
    let upsert_res = app
        .clone()
        .oneshot(upsert_req)
        .await
        .expect("upsert response");
    assert_eq!(upsert_res.status(), StatusCode::OK);
    let upsert_body = upsert_res
        .into_body()
        .collect()
        .await
        .expect("collect upsert body")
        .to_bytes();
    let upsert_value = parse_json_body(&upsert_body);
    assert_eq!(
        upsert_value["data"]["notes"],
        "Updated notes after evening check."
    );
    let updated_updated_at = upsert_value["data"]["updated_at"]
        .as_str()
        .expect("updated_at in upsert response");
    assert_ne!(updated_updated_at, original_updated_at);

    let create_second_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/logs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "log_date": "2026-04-10",
                "notes": "Second day log"
            })
            .to_string(),
        ))
        .expect("build second create request");
    let create_second_res = app
        .clone()
        .oneshot(create_second_req)
        .await
        .expect("second create response");
    assert_eq!(create_second_res.status(), StatusCode::CREATED);

    let list_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}/logs"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build list logs request");
    let list_res = app
        .clone()
        .oneshot(list_req)
        .await
        .expect("list logs response");
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_body = list_res
        .into_body()
        .collect()
        .await
        .expect("collect list body")
        .to_bytes();
    let list_value = parse_json_body(&list_body);
    assert_eq!(list_value["meta"]["total"], 2);
    let logs = list_value["data"].as_array().expect("logs array");
    assert_eq!(logs[0]["log_date"], "2026-04-10");
    assert_eq!(logs[1]["log_date"], "2026-04-08");
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn cross_user_cannot_read_or_write_logs_for_another_users_trip() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let owner = insert_test_user(&pool).await;
    let stranger = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, owner, "Private Journal").await;

    let stranger_create_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/logs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::from(
            json!({
                "log_date": "2026-04-12",
                "notes": "Should fail"
            })
            .to_string(),
        ))
        .expect("build stranger create request");
    let stranger_create_res = app
        .clone()
        .oneshot(stranger_create_req)
        .await
        .expect("stranger create response");
    assert_eq!(stranger_create_res.status(), StatusCode::NOT_FOUND);

    let owner_create_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/trips/{trip_id}/logs"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", owner.to_string())
        .body(Body::from(
            json!({
                "log_date": "2026-04-12",
                "notes": "Owner log"
            })
            .to_string(),
        ))
        .expect("build owner create request");
    let owner_create_res = app
        .clone()
        .oneshot(owner_create_req)
        .await
        .expect("owner create response");
    assert_eq!(owner_create_res.status(), StatusCode::CREATED);

    let stranger_get_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}/logs/2026-04-12"))
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::empty())
        .expect("build stranger get request");
    let stranger_get_res = app
        .clone()
        .oneshot(stranger_get_req)
        .await
        .expect("stranger get response");
    assert_eq!(stranger_get_res.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn invalid_date_in_path_is_client_error() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;
    let trip_id = create_trip(&app, user_id, "Date Validation").await;

    let req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}/logs/not-a-date"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build invalid date request");
    let res = app.oneshot(req).await.expect("invalid date response");
    assert!(
        res.status() == StatusCode::BAD_REQUEST || res.status() == StatusCode::NOT_FOUND,
        "invalid date path should return 400 or 404, got {}",
        res.status()
    );
}
