import { expect, test } from "@playwright/test";

test.describe("Auth protection (Keycloak required)", () => {
  test.skip(process.env.PLAYWRIGHT_RUN_AUTH_TESTS !== "true");

  test("unauthenticated visit to /trips redirects to Keycloak", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/trips");
    await expect.poll(() => page.url(), { timeout: 10_000 }).toMatch(/\/api\/auth\/signin/);
    await expect(page.getByRole("button", { name: /sign in with keycloak/i })).toBeVisible();
    await context.close();
  });

  test("unauthenticated visit to /rig redirects to Keycloak", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/rig");
    await expect.poll(() => page.url(), { timeout: 10_000 }).toMatch(/\/api\/auth\/signin/);
    await expect(page.getByRole("button", { name: /sign in with keycloak/i })).toBeVisible();
    await context.close();
  });

  test.describe("authenticated routes", () => {
    test.use({ storageState: ".auth/user.json" });

    test("authenticated user can access /trips", async ({ page }) => {
      await page.goto("/trips");
      await expect(page).toHaveURL(/\/trips/);
      await expect(page.getByRole("heading", { name: "Trips" })).toBeVisible();
    });

    test("authenticated user can access /rig", async ({ page }) => {
      await page.goto("/rig");
      await expect(page).toHaveURL(/\/rig/);
      await expect(page.getByRole("heading", { name: "Rig" }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
    });
  });
});
