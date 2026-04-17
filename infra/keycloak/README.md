# Keycloak realm import

The `realm-export.json` file is mounted into the Keycloak container (`--import-realm`) when using the `auth` or `full` Compose profile.

## `vagabond-web` client (Next.js + NextAuth)

- **Client ID:** `vagabond-web`
- **Access type:** public (PKCE); `KEYCLOAK_CLIENT_SECRET` in the web app can remain empty.
- **Standard flow:** enabled (`standardFlowEnabled: true`).
- **Valid redirect URIs:** include `http://localhost/api/auth/callback/keycloak` (and the `127.0.0.1` variant). Wildcards `http://localhost/*` are also listed for flexibility.
- **Web origins:** `http://localhost` and `http://127.0.0.1` (single-origin OIDC via gateway).

## Default development user

The realm export seeds a default local user for quick startup:

- **Username:** `vagabond-dev`
- **Password:** `vagabond-dev`
- **Realm role:** `vagabond-user`

This account is intended for local development only. Use managed identity provisioning (Terraform, IAM, SSO) for production.

After changing the export, restart Keycloak with a clean import or update the client in the Keycloak admin UI.
