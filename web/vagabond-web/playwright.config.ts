import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = process.env.PLAYWRIGHT_WEB_PORT ?? "3100";
const SERVER_PORT = process.env.PLAYWRIGHT_SERVER_PORT ?? "3101";
const TEST_USER_ID = process.env.PLAYWRIGHT_TEST_USER_ID ?? "11111111-1111-1111-1111-111111111111";

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
        `export DATABASE_URL=postgresql://vagabond:changeme@127.0.0.1:5432/vagabond; ` +
        `export JWT_SECRET=change-me-to-a-long-random-secret; ` +
        `export VAGABOND_DEV_AUTH=true; ` +
        `export LISTEN_ADDR=0.0.0.0:${SERVER_PORT}; ` +
        `docker exec vagabond-postgres psql -U vagabond -d vagabond -c \\"INSERT INTO users (id, keycloak_sub, email, display_name) VALUES ('${TEST_USER_ID}', 'playwright-e2e', 'playwright-e2e@example.com', 'Playwright E2E') ON CONFLICT (id) DO NOTHING;\\"; ` +
        `cargo run -p vagabond-server` +
        `"`,
      url: `http://127.0.0.1:${SERVER_PORT}/health`,
      reuseExistingServer: false,
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
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-web-security"],
        },
      },
    },
  ],
});
