use anyhow::{Context, Result};
use std::env;

#[derive(Debug)]
pub struct Config {
    pub database_url:      String,
    pub db_max_connections: u32,
    pub listen_addr:       String,
    pub jwt_secret:        String,
    pub keycloak_issuer:   Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            database_url: env::var("DATABASE_URL")
                .context("DATABASE_URL is required")?,
            db_max_connections: env::var("DB_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "10".into())
                .parse()
                .context("DB_MAX_CONNECTIONS must be a number")?,
            listen_addr: env::var("LISTEN_ADDR")
                .unwrap_or_else(|_| "0.0.0.0:3001".into()),
            jwt_secret: env::var("JWT_SECRET")
                .context("JWT_SECRET is required")?,
            keycloak_issuer: env::var("KEYCLOAK_ISSUER").ok(),
        })
    }
}
