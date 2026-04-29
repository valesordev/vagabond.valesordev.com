import { expect, test } from "@playwright/test";

test.describe("Navigation smoke tests", () => {
  test("home page renders a map canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 20_000 });
  });

  test("app shell nav links are present", async ({ page }) => {
    await page.goto("/trips");
    await expect(page.getByRole("link", { name: "Trips" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Rig" })).toBeVisible();

    await page.getByRole("link", { name: "Rig" }).click();
    await expect(page).toHaveURL(/\/rig/);

    await page.getByRole("link", { name: "Trips" }).click();
    await expect(page).toHaveURL(/\/trips/);
  });
});
