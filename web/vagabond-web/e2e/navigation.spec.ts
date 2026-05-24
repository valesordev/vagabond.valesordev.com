import { expect, test } from "@playwright/test";

test.describe("Lifestyle manager navigation", () => {
  test("dashboard renders lifestyle shell and KPI row", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "One trip on the horizon." })).toBeVisible();
    await expect(page.locator(".kpi-row")).toBeVisible();
  });

  test("sidebar links navigate to lifestyle screens", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Trip planner" }).click();
    await expect(page).toHaveURL(/\/lifestyle\/planner/);
    await expect(page.getByText("GA Pickup")).toBeVisible();

    await page.getByRole("link", { name: "Budgets" }).click();
    await expect(page).toHaveURL(/\/lifestyle\/budget/);

    await page.getByRole("link", { name: "Locations" }).click();
    await expect(page).toHaveURL(/\/lifestyle\/catalog/);

    await page.getByRole("link", { name: "Rig & gear" }).click();
    await expect(page).toHaveURL(/\/rig/);
  });
});
