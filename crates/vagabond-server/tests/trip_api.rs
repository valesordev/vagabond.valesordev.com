//! Integration tests for `/api/v1/trips`. Requires Postgres:
//! `TEST_DATABASE_URL=postgres://... cargo test -p vagabond-server --test trip_api -- --ignored`

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

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
    let app = vagabond_server::build_app(pool.clone());
    let user_id = insert_test_user(&pool).await;

    let create_req = Request::builder()
        .method("POST")
        .uri("/api/v1/trips")
        .header("content-type", "application/json")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::from(
            json!({
                "name": "Eastern Sierra",
                "description": "  June loop  "
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

    let list_req = Request::builder()
        .uri("/api/v1/trips")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(list_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes().as_ref());
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
                "description": null
            })
            .to_string(),
        ))
        .unwrap();
    let res = app.clone().oneshot(put_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes().as_ref());
    assert_eq!(v["data"]["name"], "Eastern Sierra v2");
    assert_eq!(v["data"]["description"], Value::Null);

    let del_req = Request::builder()
        .method("DELETE")
        .uri(format!("/api/v1/trips/{trip_id}"))
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(del_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes().as_ref());
    assert_eq!(v["data"], Value::Null);
    assert_eq!(v["meta"]["deleted"], true);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn missing_user_header_is_unauthorized() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool);
    let req = Request::builder()
        .uri("/api/v1/trips")
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes().as_ref());
    assert_eq!(v["data"], Value::Null);
    assert_eq!(v["error"]["code"], "UNAUTHORIZED");
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres)"]
async fn other_users_trip_is_not_found() {
    let pool = test_pool().await;
    let app = vagabond_server::build_app(pool.clone());
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
    let v = parse_json_body(&res.into_body().collect().await.unwrap().to_bytes().as_ref());
    let trip_id = Uuid::parse_str(v["data"]["id"].as_str().unwrap()).unwrap();

    let get_req = Request::builder()
        .uri(format!("/api/v1/trips/{trip_id}"))
        .header("X-Vagabond-User-Id", stranger.to_string())
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(get_req).await.unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}
