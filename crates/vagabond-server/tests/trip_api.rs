//! Integration tests for `/api/v1/trips`. Requires Postgres:
//! `TEST_DATABASE_URL=postgres://... cargo test -p vagabond-server --test trip_api -- --ignored`

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
        .expect("TEST_DATABASE_URL must be set when running ignored trip_api tests");
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

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn trip_crud_roundtrip() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;

    let create_req = Request::builder()
        .method("POST")
        .uri("/api/v1/trips")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Eastern Sierra",
                "description": "  June loop  ",
                "start_date": "2026-06-01",
                "end_date": "2026-06-08"
            })
            .to_string(),
        ))
        .unwrap();

    let res = app.clone().oneshot(create_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v = parse_json_body(&body);
    assert_eq!(v["error"], Value::Null);
    let trip_id: Uuid = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();
    assert_eq!(v["data"]["name"], "Eastern Sierra");
    assert_eq!(v["data"]["description"], "June loop");
    assert_eq!(v["data"]["start_date"], "2026-06-01");
    assert_eq!(v["data"]["end_date"], "2026-06-08");

    let list_req = Request::builder()
        .uri("/api/v1/trips")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(list_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(res.into_body().collect().await.unwrap().to_bytes().as_ref());
    assert_eq!(v["meta"]["total"], 1);
    assert_eq!(v["data"].as_array().unwrap().len(), 1);

    let get_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(get_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);

    let put_req = Request::builder()
        .method("PUT")
        .uri(format!("/api/v1/trips/{trip_id}"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Eastern Sierra v2",
                "description": null,
                "start_date": "2026-07-01",
                "end_date": null
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(put_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(res.into_body().collect().await.unwrap().to_bytes().as_ref());
    assert_eq!(v["data"]["name"], "Eastern Sierra v2");
    assert_eq!(v["data"]["description"], Value::Null);
    assert_eq!(v["data"]["start_date"], "2026-07-01");
    assert_eq!(v["data"]["end_date"], Value::Null);

    let del_req = Request::builder()
        .method("DELETE")
        .uri(format!("/api/v1/trips/{trip_id}"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(del_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(res.into_body().collect().await.unwrap().to_bytes().as_ref());
    assert_eq!(v["data"], Value::Null);
    assert_eq!(v["meta"]["deleted"], true);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn missing_user_header_is_unauthorized() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool, &test_config()).await;
    let req = Request::builder()
        .uri("/api/v1/trips")
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let v = parse_json_body(res.into_body().collect().await.unwrap().to_bytes().as_ref());
    assert_eq!(v["data"], Value::Null);
    assert_eq!(v["error"]["code"], "MISSING_TOKEN");
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn other_users_trip_is_not_found() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let owner = insert_test_user(&pool).await;
    let stranger = insert_test_user(&pool).await;

    let create_req = Request::builder()
        .method("POST")
        .uri("/api/v1/trips")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", owner.to_string())
        .body(Body::from(json!({ "name": "Secret" }).to_string()))
        .unwrap();
    let res = app.clone().oneshot(create_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let v = parse_json_body(res.into_body().collect().await.unwrap().to_bytes().as_ref());
    let trip_id = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();

    let get_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}"))
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(get_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn create_trip_without_user_row_provisions_user() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool, &test_config()).await;
    let user_id = Uuid::new_v4();

    let create_req = Request::builder()
        .method("POST")
        .uri("/api/v1/trips")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Provisioned user",
                "description": null
            })
            .to_string(),
        ))
        .unwrap();

    let res = app.oneshot(create_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v = parse_json_body(&body);
    assert_eq!(v["error"], Value::Null);
    assert_eq!(v["data"]["user_id"], user_id.to_string());
}
