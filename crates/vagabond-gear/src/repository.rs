use sqlx::PgPool;
use uuid::Uuid;
use vagabond_core::{rig::GearItem, VagabondError};

/// Repository for gear inventory operations.
/// All queries go through PostGIS-aware PostgreSQL — no geo math here.
#[derive(Clone)]
pub struct GearRepository {
    pool: PgPool,
}

impl GearRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_by_rig(&self, rig_id: Uuid) -> Result<Vec<GearItem>, VagabondError> {
        // TODO: implement
        let _ = rig_id;
        let _ = &self.pool;
        Ok(vec![])
    }

    pub async fn get(&self, id: Uuid) -> Result<GearItem, VagabondError> {
        // TODO: implement
        Err(VagabondError::NotFound(format!("gear item {id}")))
    }
}
