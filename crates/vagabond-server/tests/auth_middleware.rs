use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::routing::get;
use axum::Router;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header};
use serde::Serialize;
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt;
use uuid::Uuid;
use vagabond_server::auth::AuthState;
use vagabond_server::extractors::UserId;
use vagabond_server::state::AppState;

const TEST_ISSUER: &str = "http://localhost:8080/realms/vagabond";
const TEST_KID: &str = "test-kid";
const TEST_PRIVATE_KEY: &str = r#"-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDR9Q61wYwPBFim
hBEHlZ8xPV2u0PWUc4X9rfu9Y0B7t7wapYz752x5jejunNUXpfdIQMK/EVdx7X/8
B8/zVL1ywR7VRAxyrsmgj9rUJ+Tr/BCC1vo33MXXNSzMDM9Zzykg0NeBmJ08KNDL
4bIf8E0/4goAkGaCXYN/ksRTDK6T5jvFd0D/Frx9QxneQmegv5/tTsCy0a2Cotcl
lu+lTP8Qf6rYL549pciaf5C7cXOvT+2tdfuu0ydth9WPametuBmBKNu40jIna5xv
iwduIPE76apYIhQ7J0gKZbQiFkZ5iiVMMURjVN+PI+PgdaLEBbRWh4BpA3nnY/Ed
ZuJHoOb3AgMBAAECggEACNOnIVjECvLaDllck47TLBcvOwq/cz2udKM1Gqs/IYjB
+fW4bwtBXEMQGpNDQlk2d/YdwpbmR0hKPr9lg9RQyQFRBQcYN2xuvyWi7HxVyg0c
gGjEIFMwiejib+438CTe2ox3UMLLidO06PEGLdXWTTSnm/678rbZdrvI5/7sW85Y
+gO/JGjNu0s4feR9eITYAaRAYVK0I/N/sJxh4Etqbwhk4xPU86J1pwWZ8CtSLAYK
W1JtXwu1IoWZy2Y36SRwoaj1srZTZtm1NMnWlXYYC7qk1lG9eYRrD0SkocUgRKYh
sbqrzmUeIx9n4W2kI/KAlbPI5iA5Y6BLYcAO3FXucQKBgQD4KoUFCN3zk6NUAWa4
iSCpDVAd+sa4jowSzFmW41Q+8TB79hFLGYPnWc3ndCrNbudF56smOBlmu5XQQKJK
CX9NZTUXqPxa4o8enfzBTj0J85c3lgoNU70Dg0dejeG2rC1R0sGr/Fz4iwhKQx2C
l+tESHDxCZQStKhPNeb0PNCOBwKBgQDYlcO3TtQ+H5UKREX/wgfD3cuw9AYbim60
qUY89btKs0dVyZXsgxCxko/LIQWaYacDELSeKUHfTTz6NoI9o1g4GIs99Tel33Xj
QYjTMPp49pYYrU2txEyanvUfmGixCSZLtKoV9yyYMJFJ0zpxDe05Nl2tMaRvRkY6
8mbQ196jkQKBgQD1r5K1o0upQ7blCeYaN5ggBVAV/hoSyP0f9zOS0Eitb7biYoBI
a2BNAHl69WUSsQNCD9M/KTbsoDX3UKXayoA/rTzcya3chIPQefSro7uGSKSioWYe
P5LXEXbsw2Z8pQTRBug6TsP0RCDW9I8YpTKEDXvTBfqUckpW8TRPBI4srQKBgHV5
jiWwKSjlAncGHx2hRYr0k5YQVfu8M13kbseD1amn4ipi4+HcGULnpvzblWluTCM6
fW1IHYWcJFXnGO+L2L7ceTIK/rsGoK+6DRfX+hOAVFtgLMDyt0Yqr/QKO8bCmrX3
cUXmwpZtyXBMlOdbUW910IuvYGxGprM0ZZYjcIwxAoGAUbqbylrcwgQfJJopA7Kt
A+9IGj7vw2Vj3B8Xa8ZfwIWDU8tG+Nm+gfZ9ZhrzbrjPHOO83I2RypXU826P5Xxo
JRJygiCMxcND3rbv3yt4kmWh5xK5iUwFu/B4vvShPYMLY20kSYHrYEnBDY2eZk41
IpKL6bQgwel6jSHImJ/vsgg=
-----END PRIVATE KEY-----"#;
const TEST_N: &str = "0fUOtcGMDwRYpoQRB5WfMT1drtD1lHOF_a37vWNAe7e8GqWM--dseY3o7pzVF6X3SEDCvxFXce1__AfP81S9csEe1UQMcq7JoI_a1Cfk6_wQgtb6N9zF1zUszAzPWc8pINDXgZidPCjQy-GyH_BNP-IKAJBmgl2Df5LEUwyuk-Y7xXdA_xa8fUMZ3kJnoL-f7U7AstGtgqLXJZbvpUz_EH-q2C-ePaXImn-Qu3Fzr0_trXX7rtMnbYfVj2pnrbgZgSjbuNIyJ2ucb4sHbiDxO-mqWCIUOydICmW0IhZGeYolTDFEY1TfjyPj4HWixAW0VoeAaQN552PxHWbiR6Dm9w";
const TEST_E: &str = "AQAB";

#[derive(Debug, Serialize)]
struct TestClaims {
    sub: String,
    iss: String,
    exp: usize,
}

fn sign_token(sub: Uuid, issuer: &str, exp: usize) -> String {
    let mut header = Header::new(Algorithm::RS256);
    header.kid = Some(TEST_KID.to_string());
    let claims = TestClaims {
        sub: sub.to_string(),
        iss: issuer.to_string(),
        exp,
    };
    jsonwebtoken::encode(
        &header,
        &claims,
        &EncodingKey::from_rsa_pem(TEST_PRIVATE_KEY.as_bytes()).expect("rsa private key"),
    )
    .expect("sign jwt")
}

async fn protected_handler(UserId(user_id): UserId) -> String {
    user_id.to_string()
}

async fn test_pool() -> sqlx::PgPool {
    let url = std::env::var("TEST_DATABASE_URL")
        .expect("TEST_DATABASE_URL must be set when running ignored auth_middleware tests");
    let pool = PgPoolOptions::new()
        .connect(&url)
        .await
        .expect("connect TEST_DATABASE_URL");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("run migrations");
    pool
}

async fn protected_app(dev_auth: bool, with_key: bool) -> Router {
    let pool = test_pool().await;
    let auth = AuthState::new(Some(TEST_ISSUER.to_string()), None, dev_auth);
    if with_key {
        auth.insert_test_key(
            TEST_KID,
            DecodingKey::from_rsa_components(TEST_N, TEST_E).expect("build decoding key"),
        )
        .await;
    }
    let state = AppState::new(pool, auth);
    Router::new()
        .route("/protected", get(protected_handler))
        .with_state(state)
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres); UserId extractor runs ensure_user"]
async fn valid_token_is_accepted() {
    let app = protected_app(false, true).await;
    let user_id = Uuid::new_v4();
    let token = sign_token(user_id, TEST_ISSUER, usize::MAX);

    let req = Request::builder()
        .uri("/protected")
        .header("Authorization", format!("Bearer {token}"))
        .body(Body::empty())
        .expect("build request");
    let res = app.oneshot(req).await.expect("serve request");
    assert_eq!(res.status(), StatusCode::OK);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres); UserId extractor runs ensure_user"]
async fn expired_token_is_rejected() {
    let app = protected_app(false, true).await;
    let user_id = Uuid::new_v4();
    let token = sign_token(user_id, TEST_ISSUER, 1);

    let req = Request::builder()
        .uri("/protected")
        .header("Authorization", format!("Bearer {token}"))
        .body(Body::empty())
        .expect("build request");
    let res = app.oneshot(req).await.expect("serve request");
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres); UserId extractor runs ensure_user"]
async fn wrong_issuer_is_rejected() {
    let app = protected_app(false, true).await;
    let user_id = Uuid::new_v4();
    let token = sign_token(user_id, "http://wrong-issuer/realms/vagabond", usize::MAX);

    let req = Request::builder()
        .uri("/protected")
        .header("Authorization", format!("Bearer {token}"))
        .body(Body::empty())
        .expect("build request");
    let res = app.oneshot(req).await.expect("serve request");
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres); UserId extractor runs ensure_user"]
async fn missing_header_is_rejected() {
    let app = protected_app(false, true).await;
    let req = Request::builder()
        .uri("/protected")
        .body(Body::empty())
        .expect("build request");
    let res = app.oneshot(req).await.expect("serve request");
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL (Postgres); UserId extractor runs ensure_user"]
async fn dev_auth_mode_bypasses_jwt() {
    let app = protected_app(true, false).await;
    let user_id = Uuid::new_v4();
    let req = Request::builder()
        .uri("/protected")
        .header("X-Vagabond-User-Id", user_id.to_string())
        .body(Body::empty())
        .expect("build request");
    let res = app.oneshot(req).await.expect("serve request");
    assert_eq!(res.status(), StatusCode::OK);
}
