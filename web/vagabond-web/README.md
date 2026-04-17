# Vagabond Web E2E (Playwright)

This app includes Playwright end-to-end coverage for the MVP CRUD flows:

- Trips: create, edit, delete
- Rig profile + gear: create/update/add/edit/delete
- Field log entries: create/edit/delete
- Waypoints: add/delete from trip detail

## Prerequisites

- Docker running locally
- Node.js 20+
- Rust toolchain (used by Playwright `webServer` to run `vagabond-server`)

## Run E2E Locally

From repo root:

```bash
docker compose up -d postgres
```

From `web/vagabond-web`:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

## Useful Commands

- `npm run test:e2e` - headless test run
- `npm run test:e2e:headed` - headed Chromium run
- `npm run test:e2e:ui` - Playwright UI mode

## Test Runtime Notes

- Playwright starts both:
  - Next.js app on `PLAYWRIGHT_WEB_PORT` (default `3100`)
  - Rust API server on `PLAYWRIGHT_SERVER_PORT` (default `3101`)
- The suite seeds a deterministic local test user in Postgres via `docker exec` on `vagabond-postgres`.
- Tests run with `workers: 1` to avoid race conditions across shared test state.
- Browser launch no longer requires `--disable-web-security`; local runs are expected to use the nginx gateway single-origin setup.
