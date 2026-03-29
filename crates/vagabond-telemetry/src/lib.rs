//! # vagabond-telemetry
//!
//! Handles OTLP ingest from the Raspberry Pi Alloy agent.
//! Decoupled from trip planning per ADR-002.
//!
//! Ingest flow:
//!   Alloy agent (RPi) → OTLP/HTTP POST /api/v1/telemetry/ingest
//!   → parse_otlp_payload()
//!   → insert TelemetryPoints into PostGIS

pub mod ingest;
pub mod model;
