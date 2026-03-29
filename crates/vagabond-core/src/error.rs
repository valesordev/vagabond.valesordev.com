use thiserror::Error;

#[derive(Debug, Error)]
pub enum VagabondError {
    #[error("entity not found: {0}")]
    NotFound(String),

    #[error("validation error: {0}")]
    Validation(String),

    #[error("unauthorized")]
    Unauthorized,
}
