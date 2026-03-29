//! # vagabond-gear
//!
//! Gear inventory domain logic.
//! Owns all DB queries for gear_items; exposes a repository trait
//! so vagabond-server can inject it without depending on sqlx directly.

pub mod repository;

pub use repository::GearRepository;
