import { expect, test } from "@playwright/test";

import { resolveApiBaseUrlForEnv } from "./api";

test.describe("resolveApiBaseUrlForEnv", () => {
  test("uses explicit PLAYWRIGHT_API_BASE_URL over all defaults", () => {
    const base = resolveApiBaseUrlForEnv({
      PLAYWRIGHT_API_BASE_URL: "http://127.0.0.1:4444/",
      PLAYWRIGHT_SERVER_PORT: "3101",
      NEXT_PUBLIC_API_URL: "http://localhost",
    });

    expect(base).toBe("http://127.0.0.1:4444");
  });

  test("uses PLAYWRIGHT_SERVER_PORT when explicit API base is absent", () => {
    const base = resolveApiBaseUrlForEnv({
      PLAYWRIGHT_SERVER_PORT: "3201",
      NEXT_PUBLIC_API_URL: "http://localhost",
    });

    expect(base).toBe("http://127.0.0.1:3201");
  });

  test("falls back to default Playwright server URL", () => {
    const base = resolveApiBaseUrlForEnv({
      NEXT_PUBLIC_API_URL: "http://localhost",
    });

    expect(base).toBe("http://127.0.0.1:3101");
  });
});
