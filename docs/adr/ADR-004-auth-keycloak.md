# ADR-004: Authentication via Keycloak

**Status**: Accepted  
**Date**: 2026-03-20  
**Deciders**: Brian (initial)

## Context

Vagabond needs auth. The requirements:

- **Personal deployment**: single user (Brian) to start; multi-user for community v0.3
- **OIDC/OAuth2**: standard token flow; `vagabond-server` validates JWTs, never stores passwords
- **Homelab consistency**: Brian already runs Keycloak for Valesor; reusing it eliminates
  a second identity provider and keeps SSO consistent across personal projects
- **Community deployability**: operators should be able to substitute any OIDC-compatible
  provider (Auth0, Authentik, Dex, etc.) without modifying Vagabond's code

## Decision

Keycloak is the **reference OIDC provider**, shipped as `--profile auth` in Docker Compose.

- `vagabond-server` validates tokens against a configurable `KEYCLOAK_ISSUER` (JWKS endpoint)
- The issuer URL is injected via env var — any OIDC-compliant provider works as a drop-in
- A `realm-export.json` for the `vagabond` realm is committed to `infra/keycloak/`
  for reproducible local dev setup
- For Brian's homelab: `KEYCLOAK_ISSUER` points to his existing Keycloak instance;
  the `--profile auth` sidecar is not needed

## Consequences

**Positive**
- No password storage in `vagabond-server` — pure JWT validation
- Provider-agnostic: env var swap substitutes any OIDC issuer
- Realm export makes local dev/testing reproducible
- Aligns with Valesor SSO; single sign-on across Brian's personal apps

**Negative**
- Keycloak is heavy (~500MB image, 512MB RAM minimum) for operators who just want simple auth
- Community users unfamiliar with Keycloak face a non-trivial setup for multi-user deployments
- Must document the "bring your own OIDC provider" path clearly in README

## Alternatives Considered

- **Built-in JWT + user table**: simplest, but reinventing auth is a known footgun; rejected
- **Authentik**: lighter than Keycloak, Python-based, good UX. Viable alternative for
  community users — should be documented as a tested alternative in v0.2
- **Auth.js (NextAuth)**: frontend-only auth, doesn't protect the Rust API layer; rejected
- **Dex**: minimal OIDC proxy, good for federating existing identity sources. Too minimal
  for multi-user community case (no built-in user management UI)
