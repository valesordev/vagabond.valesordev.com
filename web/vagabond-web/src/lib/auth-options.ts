import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

function keycloakBase(internal = false): string {
  // For server-side calls (token exchange, userinfo) use KEYCLOAK_INTERNAL_URL so
  // Docker-to-Docker traffic stays on the overlay network.
  // For browser-facing URLs always use NEXT_PUBLIC_KEYCLOAK_URL (host-accessible).
  const envVar = internal ? "KEYCLOAK_INTERNAL_URL" : "NEXT_PUBLIC_KEYCLOAK_URL";
  return (process.env[envVar] ?? "http://localhost/auth").replace(/\/$/, "");
}

function keycloakIssuer(): string {
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "vagabond";
  // Use internal URL so NextAuth can reach Keycloak for OIDC discovery + token exchange
  return `${keycloakBase(true)}/realms/${realm}`;
}

function keycloakAuthorizationUrl(): string {
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "vagabond";
  // Must use browser-accessible (public) URL for the OAuth redirect
  return `${keycloakBase(false)}/realms/${realm}/protocol/openid-connect/auth`;
}

function decodeJwtExp(accessToken: string): number | undefined {
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "vagabond-web",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer: keycloakIssuer(),
      // Override authorization URL to use the browser-accessible public hostname.
      // NextAuth uses the issuer's discovery for token/userinfo (server-to-server),
      // but the auth redirect must resolve from the user's browser.
      authorization: keycloakAuthorizationUrl(),
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          error: undefined,
        };
      }

      const accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      const refreshToken = typeof token.refreshToken === "string" ? token.refreshToken : undefined;
      let expiresAt = typeof token.expiresAt === "number" ? token.expiresAt : undefined;

      if (accessToken && expiresAt === undefined) {
        expiresAt = decodeJwtExp(accessToken);
      }

      const now = Math.floor(Date.now() / 1000);
      const bufferSeconds = 60;

      const isExpired =
        accessToken !== undefined &&
        expiresAt !== undefined &&
        now >= expiresAt - bufferSeconds;

      if (!isExpired && accessToken) {
        return token;
      }

      if (!refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      const issuer = keycloakIssuer();
      const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "vagabond-web";

      try {
        const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });

        if (!response.ok) {
          return { ...token, error: "RefreshAccessTokenError" };
        }

        const refreshed = (await response.json()) as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
        };

        return {
          ...token,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? refreshToken,
          expiresAt: now + refreshed.expires_in,
          error: undefined,
        };
      } catch {
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.error = typeof token.error === "string" ? token.error : undefined;
      return session;
    },
  },
};
