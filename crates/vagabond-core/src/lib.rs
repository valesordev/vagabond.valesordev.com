//! # vagabond-core
//!
//! Pure domain types and traits for the Vagabond platform.
//! This crate has zero infrastructure dependencies — no DB, no HTTP, no async runtime.
//! All other crates depend on this one.

pub mod error;
pub mod field_log;
pub mod geo;
pub mod rig;
pub mod trip;
pub mod trip_event;

pub use error::VagabondError;
