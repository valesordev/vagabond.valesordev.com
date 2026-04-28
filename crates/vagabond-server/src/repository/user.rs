//! User provisioning for foreign keys (`trips.user_id`, `rigs.user_id`, …).

use sqlx::PgPool;
use uuid::Uuid;
use vagabond_core::VagabondError;

/// Ensures a `users` row exists for this identity so domain tables can reference `user_id`.
///
/// Keycloak JWT `sub` is treated as the primary key UUID; first authenticated request inserts
/// the row, later requests update `email` if it changed.
pub async fn ensure_user(
    pool: &PgPool,
    id: Uuid,
    keycloak_sub: &str,
    email: &str,
) -> Result<(), VagabondError> {
    sqlx::query(
        r#"
        INSERT INTO users (id, keycloak_sub, email, display_name)
        VALUES ($1, $2, $3, NULL)
        ON CONFLICT (id) DO UPDATE SET
          keycloak_sub = EXCLUDED.keycloak_sub,
          email = EXCLUDED.email,
          updated_at = NOW()
        "#,
    )
    .bind(id)
    .bind(keycloak_sub)
    .bind(email)
    .execute(pool)
    .await
    .map_err(map_db_err)?;
    Ok(())
}

fn map_db_err(e: sqlx::Error) -> VagabondError {
    tracing::error!(error = %e, "ensure_user database error");
    VagabondError::Validation("could not complete database operation".into())
}
