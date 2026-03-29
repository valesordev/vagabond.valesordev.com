use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;
use vagabond_core::{trip::Trip, VagabondError};

#[derive(Debug, sqlx::FromRow)]
struct TripRow {
    id:          Uuid,
    user_id:     Uuid,
    name:        String,
    description: Option<String>,
    created_at:  DateTime<Utc>,
    updated_at:  DateTime<Utc>,
}

fn row_to_trip(row: TripRow) -> Trip {
    Trip {
        id:          row.id,
        user_id:     row.user_id,
        name:        row.name,
        description: row.description,
        created_at:  row.created_at,
        updated_at:  row.updated_at,
    }
}

fn map_db_err(e: sqlx::Error) -> VagabondError {
    if let sqlx::Error::Database(ref db) = e {
        if db.code().as_deref() == Some("23503") {
            return VagabondError::Validation(
                "invalid reference: related row does not exist (check user_id)".into(),
            );
        }
    }
    tracing::error!(error = %e, "database error");
    VagabondError::Validation("could not complete database operation".into())
}

pub async fn list_for_user(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
    offset: i64,
) -> Result<(Vec<Trip>, i64), VagabondError> {
    let total: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint
        FROM trips
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(map_db_err)?;

    let rows: Vec<TripRow> = sqlx::query_as(
        r#"
        SELECT id, user_id, name, description, created_at, updated_at
        FROM trips
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(user_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
    .map_err(map_db_err)?;

    Ok((rows.into_iter().map(row_to_trip).collect(), total))
}

pub async fn get_by_id_for_user(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<Trip, VagabondError> {
    let row: Option<TripRow> = sqlx::query_as(
        r#"
        SELECT id, user_id, name, description, created_at, updated_at
        FROM trips
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_trip)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {id}")))
}

pub async fn create(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    description: Option<String>,
) -> Result<Trip, VagabondError> {
    let row: TripRow = sqlx::query_as(
        r#"
        INSERT INTO trips (user_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, name, description, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(name)
    .bind(description)
    .fetch_one(pool)
    .await
    .map_err(map_db_err)?;

    Ok(row_to_trip(row))
}

pub async fn update_for_user(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    name: &str,
    description: Option<String>,
) -> Result<Trip, VagabondError> {
    let row: Option<TripRow> = sqlx::query_as(
        r#"
        UPDATE trips
        SET name = $3,
            description = $4,
            updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, name, description, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(name)
    .bind(description)
    .fetch_optional(pool)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_trip)
        .ok_or_else(|| VagabondError::NotFound(format!("trip not found: {id}")))
}

pub async fn delete_for_user(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<bool, VagabondError> {
    let result = sqlx::query(
        r#"
        DELETE FROM trips
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .execute(pool)
    .await
    .map_err(map_db_err)?;

    if result.rows_affected() == 0 {
        return Err(VagabondError::NotFound(format!("trip not found: {id}")));
    }
    Ok(true)
}
