# crates/vagabond-server/Dockerfile
# Multi-stage build — final image is ~20MB scratch-based binary

# ── Build stage ───────────────────────────────────────────────────────────────
FROM rust:1.77-slim-bookworm AS builder

WORKDIR /build

# Install build deps (needed for sqlx linking against libssl/libpq)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache workspace dependency downloads before copying full source
# (layer busting only happens when Cargo.toml/lock files change)
COPY Cargo.toml Cargo.lock ./
COPY crates/vagabond-core/Cargo.toml      crates/vagabond-core/Cargo.toml
COPY crates/vagabond-server/Cargo.toml   crates/vagabond-server/Cargo.toml
COPY crates/vagabond-gear/Cargo.toml     crates/vagabond-gear/Cargo.toml
COPY crates/vagabond-telemetry/Cargo.toml crates/vagabond-telemetry/Cargo.toml

# Stub lib.rs files so Cargo can resolve the workspace without full source
RUN mkdir -p crates/vagabond-core/src && echo "pub fn _stub(){}" > crates/vagabond-core/src/lib.rs \
 && mkdir -p crates/vagabond-gear/src && echo "pub fn _stub(){}" > crates/vagabond-gear/src/lib.rs \
 && mkdir -p crates/vagabond-telemetry/src && echo "pub fn _stub(){}" > crates/vagabond-telemetry/src/lib.rs \
 && mkdir -p crates/vagabond-server/src && echo "fn main(){}" > crates/vagabond-server/src/main.rs

RUN cargo build --release --bin vagabond-server 2>/dev/null || true

# Now copy real source and rebuild (only changed crates recompile)
COPY crates/ crates/
RUN touch crates/vagabond-server/src/main.rs \
 && SQLX_OFFLINE=true cargo build --release --bin vagabond-server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /build/target/release/vagabond-server /app/vagabond-server
COPY crates/vagabond-server/migrations /app/migrations

ENV RUST_LOG=info

EXPOSE 3001

ENTRYPOINT ["/app/vagabond-server"]
