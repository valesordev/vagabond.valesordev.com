import { expect, test } from "@playwright/test";

test.describe("navigation", () => {
  test("home redirects to trips", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/trips\/?$/);
  });

  test("product nav reaches trips and rig", async ({ page }) => {
    await page.goto("/trips");
    await page.getByRole("link", { name: "Rig", exact: true }).click();
    await expect(page).toHaveURL(/\/rig\/?$/);
    await page.getByRole("link", { name: "Trips", exact: true }).click();
    await expect(page).toHaveURL(/\/trips\/?$/);
  });

  test("prototype lifestyle screens remain reachable", async ({ page }) => {
    await page.goto("/lifestyle");
    await expect(page).toHaveURL(/\/lifestyle\/?$/);
    await page.getByRole("link", { name: "Trip planner" }).click();
    await expect(page).toHaveURL(/\/lifestyle\/planner/);
  });
});
