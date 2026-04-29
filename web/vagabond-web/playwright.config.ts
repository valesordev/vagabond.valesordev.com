import { defineConfig, devices } from "@playwright/test";

function sanitizeEnvValue(value: string | undefined, fallback: string): string {
  const normalized = value?.split("#")[0]?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

const WEB_PORT = process.env.PLAYWRIGHT_WEB_PORT ?? "3100";
const AUTH_WEB_PORT = process.env.PLAYWRIGHT_AUTH_WEB_PORT ?? "3200";
const SERVER_PORT = process.env.PLAYWRIGHT_SERVER_PORT ?? "3101";
const POSTGRES_DB = sanitizeEnvValue(
  process.env.PLAYWRIGHT_POSTGRES_DB ?? process.env.POSTGRES_DB,
  "vagabond",
);
const POSTGRES_USER = sanitizeEnvValue(
  process.env.PLAYWRIGHT_POSTGRES_USER ?? process.env.POSTGRES_USER,
  "vagabond",
);
const POSTGRES_PASSWORD = sanitizeEnvValue(
  process.env.PLAYWRIGHT_POSTGRES_PASSWORD ?? process.env.POSTGRES_PASSWORD,
  "changeme",
);
const POSTGRES_PORT = sanitizeEnvValue(
  process.env.PLAYWRIGHT_POSTGRES_PORT ?? process.env.POSTGRES_PORT,
  "5432",
);
const TEST_USER_ID = process.env.PLAYWRIGHT_TEST_USER_ID ?? "11111111-1111-1111-1111-111111111111";
const SHOULD_RUN_AUTH_TESTS = process.env.PLAYWRIGHT_RUN_AUTH_TESTS === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: {
      "X-Vagabond-User-Id": TEST_USER_ID,
    },
  },
  webServer: [
    {
      command:
        `bash -lc "` +
        `export CARGO_TARGET_DIR=/tmp/vagabond-e2e-target; ` +
        `export POSTGRES_HOST=\\\${PLAYWRIGHT_POSTGRES_HOST:-\\\$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' vagabond-postgres)}; ` +
        `export POSTGRES_DB=${POSTGRES_DB}; ` +
        `export POSTGRES_USER=${POSTGRES_USER}; ` +
        `export POSTGRES_PASSWORD=${POSTGRES_PASSWORD}; ` +
        `export POSTGRES_PORT=${POSTGRES_PORT}; ` +
        `export DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@\\\${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}; ` +
        `export JWT_SECRET=change-me-to-a-long-random-secret; ` +
        `export VAGABOND_DEV_AUTH=true; ` +
        `export LISTEN_ADDR=0.0.0.0:${SERVER_PORT}; ` +
        `docker exec -e PGPASSWORD=\\\"${POSTGRES_PASSWORD}\\\" vagabond-postgres psql -U \\\"${POSTGRES_USER}\\\" -d \\\"${POSTGRES_DB}\\\" -c \\"INSERT INTO users (id, keycloak_sub, email, display_name) VALUES ('${TEST_USER_ID}', 'playwright-e2e', 'playwright-e2e@example.com', 'Playwright E2E') ON CONFLICT (id) DO NOTHING;\\"; ` +
        `cargo run -p vagabond-server` +
        `"`,
      url: `http://127.0.0.1:${SERVER_PORT}/health`,
      reuseExistingServer: !!process.env.CI,
      timeout: 180_000,
      cwd: "../..",
    },
    {
      command:
        `NEXT_PUBLIC_API_URL=http://127.0.0.1:${SERVER_PORT} ` +
        `NEXT_PUBLIC_VAGABOND_DEV_AUTH=true ` +
        `NEXTAUTH_URL=http://127.0.0.1:${WEB_PORT} ` +
        `NEXTAUTH_SECRET=playwright-e2e-secret ` +
        `NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080 ` +
        `NEXT_PUBLIC_KEYCLOAK_REALM=vagabond ` +
        `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=vagabond-web ` +
        `npm run dev -- --hostname 127.0.0.1 --port ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: !!process.env.CI,
      timeout: 180_000,
    },
    ...(SHOULD_RUN_AUTH_TESTS
      ? [
          {
            command:
              `NEXT_PUBLIC_API_URL=http://127.0.0.1:${SERVER_PORT} ` +
              `NEXT_PUBLIC_VAGABOND_DEV_AUTH=false ` +
              `NEXTAUTH_URL=http://127.0.0.1:${AUTH_WEB_PORT} ` +
              `NEXTAUTH_SECRET=playwright-e2e-secret ` +
              `NEXT_PUBLIC_KEYCLOAK_URL=${process.env.PLAYWRIGHT_KEYCLOAK_URL ?? "http://localhost/auth"} ` +
              `KEYCLOAK_INTERNAL_URL=${process.env.PLAYWRIGHT_KEYCLOAK_INTERNAL_URL ?? "http://localhost:8080/auth"} ` +
              `KEYCLOAK_CLIENT_SECRET=${process.env.KEYCLOAK_CLIENT_SECRET ?? "change-me"} ` +
              `NEXT_PUBLIC_KEYCLOAK_REALM=vagabond ` +
              `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=vagabond-web ` +
              `npm run dev -- --hostname 127.0.0.1 --port ${AUTH_WEB_PORT}`,
            url: `http://127.0.0.1:${AUTH_WEB_PORT}`,
            reuseExistingServer: !!process.env.CI,
            timeout: 180_000,
          },
        ]
      : []),
  ],
  projects: [
    {
      name: "chromium",
      testIgnore: ["**/auth/**/*.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-web-security"],
        },
      },
    },
    {
      name: "auth setup",
      testMatch: "**/auth.setup.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://127.0.0.1:${AUTH_WEB_PORT}`,
      },
    },
    {
      name: "auth",
      testMatch: "**/auth/**/*.spec.ts",
      dependencies: ["auth setup"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://127.0.0.1:${AUTH_WEB_PORT}`,
        storageState: ".auth/user.json",
      },
    },
  ],
});
