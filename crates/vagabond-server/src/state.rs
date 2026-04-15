use sqlx::PgPool;

use crate::auth::AuthState;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub auth: AuthState,
}

impl AppState {
    pub fn new(db: PgPool, auth: AuthState) -> Self {
        Self { db, auth }
    }
}
