//! # vagabond-core
//!
//! Pure domain types and traits for the Vagabond platform.
//! This crate has zero infrastructure dependencies — no DB, no HTTP, no async runtime.
//! All other crates depend on this one.

pub mod error;
pub mod trip;
pub mod rig;
pub mod geo;

pub use error::VagabondError;
