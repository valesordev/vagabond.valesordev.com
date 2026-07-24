# US-011: Authenticate via Keycloak

| Field | Value |
|-------|-------|
| Release | v0.1 |
| Backbone | Infra |
| Persona | Solo overlander / remote worker |

## Story

As a solo overlander running Vagabond at home  
I want to sign in through Keycloak (OIDC)  
so that API access is tied to my identity without Vagabond storing passwords.

## Acceptance criteria

1. Given Compose is started with the `auth` profile, when I open the web app, then I can complete OIDC login via Keycloak and receive a session/token usable by the API.
2. Given a valid JWT from the configured issuer, when I call a protected `/api/v1` route, then the request succeeds.
3. Given no token or an invalid token (and `VAGABOND_DEV_AUTH` is disabled), when I call a protected route, then the API returns 401 with a machine-readable error.
4. Local/dev may use `VAGABOND_DEV_AUTH` + header user id for tests, but home “done” path is Keycloak profile — documented in README / Keycloak infra notes.
5. Vagabond does not implement its own password database.

## ADR links

- [ADR-004](../../adr/ADR-004-auth-keycloak.md) — Keycloak reference OIDC; BYO issuer; dev auth escape hatch

## Out of scope

- Multi-user sharing / ACLs beyond single-owner personal use
- Edge profile single-user header auth as the home-deploy path (ADR-014 is separate)
- Social login branding polish

## Build notes

- `infra/keycloak/` realm export and README
- Server JWT validation / middleware — verify current wiring vs ADR-004 addendum
- Compose: `--profile auth` (README examples should show the profile flag when fixed)
