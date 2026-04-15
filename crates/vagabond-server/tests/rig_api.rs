//! Integration tests for `/api/v1/rigs` and nested gear routes. Requires Postgres:
//! `TEST_DATABASE_URL=postgres://... cargo test -p vagabond-server --test rig_api -- --ignored`

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
        .expect("TEST_DATABASE_URL must be set when running ignored rig_api tests");
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
async fn rig_crud_roundtrip() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;

    let create_req = Request::builder()
        .method("POST")
        .uri("/api/v1/rigs")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "4Runner",
                "make": "Toyota",
                "model": "4Runner",
                "year": 2021,
                "fuel_capacity_gal": 23.0,
                "notes": "daily driver + trip rig"
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(create_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    let rig_id = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();

    let get_req = Request::builder()
        .uri(format!("/api/v1/rigs/{rig_id}"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(get_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    assert_eq!(v["data"]["name"], "4Runner");

    let list_req = Request::builder()
        .uri("/api/v1/rigs")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(list_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    assert_eq!(v["data"].as_array().map(|a| a.len()), Some(1));

    let update_req = Request::builder()
        .method("PUT")
        .uri(format!("/api/v1/rigs/{rig_id}"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "4Runner Trail",
                "make": "Toyota",
                "model": "4Runner",
                "year": 2021,
                "fuel_capacity_gal": 24.5,
                "notes": null
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(update_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    assert_eq!(v["data"]["name"], "4Runner Trail");
    assert_eq!(v["data"]["notes"], Value::Null);

    let delete_req = Request::builder()
        .method("DELETE")
        .uri(format!("/api/v1/rigs/{rig_id}"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(delete_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    assert_eq!(v["data"]["deleted"], true);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn gear_crud_roundtrip() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let user_id = insert_test_user(&pool).await;

    let create_rig_req = Request::builder()
        .method("POST")
        .uri("/api/v1/rigs")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Rig",
                "make": "Toyota",
                "model": "4Runner",
                "year": 2021,
                "fuel_capacity_gal": 23.0,
                "notes": null
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(create_rig_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    let rig_id = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();

    let create_gear_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/rigs/{rig_id}/gear"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Jackery 2000",
                "category": "Electronics",
                "weight_oz": 690.5,
                "storage_zone": "rear_cargo",
                "notes": null
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(create_gear_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    let gear_id = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();
    assert_eq!(v["data"]["storage_zone"], "rear_cargo");

    let list_gear_req = Request::builder()
        .uri(format!("/api/v1/rigs/{rig_id}/gear"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(list_gear_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    assert_eq!(v["data"].as_array().map(|a| a.len()), Some(1));

    let update_req = Request::builder()
        .method("PUT")
        .uri(format!("/api/v1/rigs/{rig_id}/gear/{gear_id}"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Jackery 2000 Pro",
                "category": "Electronics",
                "weight_oz": 700.0,
                "storage_zone": "cab",
                "notes": "cab for quick access"
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(update_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    assert_eq!(v["data"]["name"], "Jackery 2000 Pro");
    assert_eq!(v["data"]["storage_zone"], "cab");

    let delete_req = Request::builder()
        .method("DELETE")
        .uri(format!("/api/v1/rigs/{rig_id}/gear/{gear_id}"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(delete_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    assert_eq!(v["data"]["deleted"], true);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn cross_user_isolation_for_rig_and_gear() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone(), &test_config()).await;
    let owner = insert_test_user(&pool).await;
    let stranger = insert_test_user(&pool).await;

    let create_rig_req = Request::builder()
        .method("POST")
        .uri("/api/v1/rigs")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", owner.to_string())
        .body(Body::from(
            json!({
                "name": "Private",
                "make": "Toyota",
                "model": "4Runner",
                "year": 2021,
                "fuel_capacity_gal": 23.0,
                "notes": null
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(create_rig_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    let rig_id = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();

    let create_gear_req = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/rigs/{rig_id}/gear"))
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", owner.to_string())
        .body(Body::from(
            json!({
                "name": "Recovery Kit",
                "category": "Safety",
                "weight_oz": 160.0,
                "storage_zone": "rear_cargo",
                "notes": null
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(create_gear_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes());
    let gear_id = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();

    let stranger_get_rig_req = Request::builder()
        .uri(format!("/api/v1/rigs/{rig_id}"))
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(stranger_get_rig_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);

    let stranger_get_gear_req = Request::builder()
        .uri(format!("/api/v1/rigs/{rig_id}/gear/{gear_id}"))
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(stranger_get_gear_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn missing_auth_header_returns_401() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool, &test_config()).await;

    let req = Request::builder()
        .uri("/api/v1/rigs")
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}
