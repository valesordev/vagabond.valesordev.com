use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;
use vagabond_core::rig::{GearItem, Rig, StorageZone};
use vagabond_core::VagabondError;

#[derive(Debug)]
pub struct CreateRigInput {
    pub name: String,
    pub make: String,
    pub model: String,
    pub year: i32,
    pub fuel_capacity_gal: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug)]
pub struct UpdateRigInput {
    pub name: String,
    pub make: String,
    pub model: String,
    pub year: i32,
    pub fuel_capacity_gal: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug)]
pub struct CreateGearInput {
    pub name: String,
    pub category: String,
    pub weight_oz: Option<f64>,
    pub storage_zone: StorageZone,
    pub notes: Option<String>,
}

#[derive(Debug)]
pub struct UpdateGearInput {
    pub name: String,
    pub category: String,
    pub weight_oz: Option<f64>,
    pub storage_zone: StorageZone,
    pub notes: Option<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct RigRow {
    id: Uuid,
    user_id: Uuid,
    name: String,
    make: String,
    model: String,
    year: i32,
    fuel_capacity_gal: Option<f64>,
    notes: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow)]
struct GearRow {
    id: Uuid,
    rig_id: Uuid,
    name: String,
    category: String,
    weight_oz: Option<f64>,
    storage_zone: String,
    notes: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

fn map_db_err(e: sqlx::Error) -> VagabondError {
    if let sqlx::Error::Database(ref db) = e {
        if db.code().as_deref() == Some("23503") {
            return VagabondError::Validation(
                "invalid reference: related row does not exist".into(),
            );
        }
    }
    tracing::error!(error = %e, "database error");
    VagabondError::Validation("could not complete database operation".into())
}

fn parse_storage_zone(value: &str) -> Result<StorageZone, VagabondError> {
    match value {
        "rear_cargo" => Ok(StorageZone::RearCargo),
        "cargo_carrier" => Ok(StorageZone::CargoCarrier),
        "cab" => Ok(StorageZone::Cab),
        "rooftop" => Ok(StorageZone::Rooftop),
        "other" => Ok(StorageZone::Other),
        _ => Err(VagabondError::Validation(format!(
            "invalid storage_zone: {value}"
        ))),
    }
}

fn storage_zone_to_db(value: &StorageZone) -> &'static str {
    match value {
        StorageZone::RearCargo => "rear_cargo",
        StorageZone::CargoCarrier => "cargo_carrier",
        StorageZone::Cab => "cab",
        StorageZone::Rooftop => "rooftop",
        StorageZone::Other => "other",
    }
}

fn row_to_rig(row: RigRow) -> Rig {
    Rig {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        make: row.make,
        model: row.model,
        year: row.year,
        fuel_capacity_gal: row.fuel_capacity_gal,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn row_to_gear(row: GearRow) -> Result<GearItem, VagabondError> {
    Ok(GearItem {
        id: row.id,
        rig_id: row.rig_id,
        name: row.name,
        category: row.category,
        weight_oz: row.weight_oz,
        storage_zone: parse_storage_zone(&row.storage_zone)?,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
    })
}

pub async fn list_for_user(db: &PgPool, user_id: Uuid) -> Result<Vec<Rig>, VagabondError> {
    let rows: Vec<RigRow> = sqlx::query_as(
        r#"
        SELECT id, user_id, name, make, model, year, fuel_capacity_gal::float8 AS fuel_capacity_gal, notes, created_at, updated_at
        FROM rigs
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(map_db_err)?;

    Ok(rows.into_iter().map(row_to_rig).collect())
}

pub async fn create(
    db: &PgPool,
    user_id: Uuid,
    input: CreateRigInput,
) -> Result<Rig, VagabondError> {
    let row: RigRow = sqlx::query_as(
        r#"
        INSERT INTO rigs (user_id, name, make, model, year, fuel_capacity_gal, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, name, make, model, year, fuel_capacity_gal::float8 AS fuel_capacity_gal, notes, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(input.name)
    .bind(input.make)
    .bind(input.model)
    .bind(input.year)
    .bind(input.fuel_capacity_gal)
    .bind(input.notes)
    .fetch_one(db)
    .await
    .map_err(map_db_err)?;

    Ok(row_to_rig(row))
}

pub async fn get_by_id_for_user(
    db: &PgPool,
    id: Uuid,
    user_id: Uuid,
) -> Result<Rig, VagabondError> {
    let row: Option<RigRow> = sqlx::query_as(
        r#"
        SELECT id, user_id, name, make, model, year, fuel_capacity_gal::float8 AS fuel_capacity_gal, notes, created_at, updated_at
        FROM rigs
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_rig)
        .ok_or_else(|| VagabondError::NotFound(format!("rig not found: {id}")))
}

pub async fn update_for_user(
    db: &PgPool,
    id: Uuid,
    user_id: Uuid,
    input: UpdateRigInput,
) -> Result<Rig, VagabondError> {
    let row: Option<RigRow> = sqlx::query_as(
        r#"
        UPDATE rigs
        SET name = $3,
            make = $4,
            model = $5,
            year = $6,
            fuel_capacity_gal = $7,
            notes = $8,
            updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, name, make, model, year, fuel_capacity_gal::float8 AS fuel_capacity_gal, notes, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(input.name)
    .bind(input.make)
    .bind(input.model)
    .bind(input.year)
    .bind(input.fuel_capacity_gal)
    .bind(input.notes)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    row.map(row_to_rig)
        .ok_or_else(|| VagabondError::NotFound(format!("rig not found: {id}")))
}

pub async fn delete_for_user(db: &PgPool, id: Uuid, user_id: Uuid) -> Result<(), VagabondError> {
    let result = sqlx::query(
        r#"
        DELETE FROM rigs
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(id)
    .bind(user_id)
    .execute(db)
    .await
    .map_err(map_db_err)?;

    if result.rows_affected() == 0 {
        return Err(VagabondError::NotFound(format!("rig not found: {id}")));
    }
    Ok(())
}

pub async fn list_gear_for_rig(
    db: &PgPool,
    rig_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<GearItem>, VagabondError> {
    let rows: Vec<GearRow> = sqlx::query_as(
        r#"
        SELECT g.id, g.rig_id, g.name, g.category, g.weight_oz::float8 AS weight_oz, g.storage_zone, g.notes, g.created_at, g.updated_at
        FROM gear_items g
        INNER JOIN rigs r ON r.id = g.rig_id
        WHERE g.rig_id = $1 AND r.user_id = $2
        ORDER BY g.created_at DESC
        "#,
    )
    .bind(rig_id)
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(map_db_err)?;

    if rows.is_empty() {
        ensure_rig_owned(db, rig_id, user_id).await?;
    }

    rows.into_iter().map(row_to_gear).collect()
}

pub async fn create_gear(
    db: &PgPool,
    rig_id: Uuid,
    input: CreateGearInput,
) -> Result<GearItem, VagabondError> {
    let row: GearRow = sqlx::query_as(
        r#"
        INSERT INTO gear_items (rig_id, name, category, weight_oz, storage_zone, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, rig_id, name, category, weight_oz::float8 AS weight_oz, storage_zone, notes, created_at, updated_at
        "#,
    )
    .bind(rig_id)
    .bind(input.name)
    .bind(input.category)
    .bind(input.weight_oz)
    .bind(storage_zone_to_db(&input.storage_zone))
    .bind(input.notes)
    .fetch_one(db)
    .await
    .map_err(map_db_err)?;

    row_to_gear(row)
}

pub async fn get_gear_by_id(
    db: &PgPool,
    rig_id: Uuid,
    gear_id: Uuid,
    user_id: Uuid,
) -> Result<GearItem, VagabondError> {
    let row: Option<GearRow> = sqlx::query_as(
        r#"
        SELECT g.id, g.rig_id, g.name, g.category, g.weight_oz::float8 AS weight_oz, g.storage_zone, g.notes, g.created_at, g.updated_at
        FROM gear_items g
        INNER JOIN rigs r ON r.id = g.rig_id
        WHERE g.id = $1 AND g.rig_id = $2 AND r.user_id = $3
        "#,
    )
    .bind(gear_id)
    .bind(rig_id)
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    if let Some(row) = row {
        return row_to_gear(row);
    }
    ensure_rig_owned(db, rig_id, user_id).await?;
    Err(VagabondError::NotFound(format!(
        "gear item not found: {gear_id}"
    )))
}

pub async fn update_gear(
    db: &PgPool,
    rig_id: Uuid,
    gear_id: Uuid,
    user_id: Uuid,
    input: UpdateGearInput,
) -> Result<GearItem, VagabondError> {
    let row: Option<GearRow> = sqlx::query_as(
        r#"
        UPDATE gear_items AS g
        SET name = $4,
            category = $5,
            weight_oz = $6,
            storage_zone = $7,
            notes = $8,
            updated_at = now()
        FROM rigs AS r
        WHERE g.id = $1
          AND g.rig_id = $2
          AND r.id = g.rig_id
          AND r.user_id = $3
        RETURNING g.id, g.rig_id, g.name, g.category, g.weight_oz::float8 AS weight_oz, g.storage_zone, g.notes, g.created_at, g.updated_at
        "#,
    )
    .bind(gear_id)
    .bind(rig_id)
    .bind(user_id)
    .bind(input.name)
    .bind(input.category)
    .bind(input.weight_oz)
    .bind(storage_zone_to_db(&input.storage_zone))
    .bind(input.notes)
    .fetch_optional(db)
    .await
    .map_err(map_db_err)?;

    if let Some(row) = row {
        return row_to_gear(row);
    }
    ensure_rig_owned(db, rig_id, user_id).await?;
    Err(VagabondError::NotFound(format!(
        "gear item not found: {gear_id}"
    )))
}

pub async fn delete_gear(
    db: &PgPool,
    rig_id: Uuid,
    gear_id: Uuid,
    user_id: Uuid,
) -> Result<(), VagabondError> {
    let result = sqlx::query(
        r#"
        DELETE FROM gear_items AS g
        USING rigs AS r
        WHERE g.id = $1
          AND g.rig_id = $2
          AND r.id = g.rig_id
          AND r.user_id = $3
        "#,
    )
    .bind(gear_id)
    .bind(rig_id)
    .bind(user_id)
    .execute(db)
    .await
    .map_err(map_db_err)?;

    if result.rows_affected() > 0 {
        return Ok(());
    }
    ensure_rig_owned(db, rig_id, user_id).await?;
    Err(VagabondError::NotFound(format!(
        "gear item not found: {gear_id}"
    )))
}

async fn ensure_rig_owned(db: &PgPool, rig_id: Uuid, user_id: Uuid) -> Result<(), VagabondError> {
    let exists: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1
            FROM rigs
            WHERE id = $1 AND user_id = $2
        )
        "#,
    )
    .bind(rig_id)
    .bind(user_id)
    .fetch_one(db)
    .await
    .map_err(map_db_err)?;

    if exists {
        Ok(())
    } else {
        Err(VagabondError::NotFound(format!("rig not found: {rig_id}")))
    }
}
