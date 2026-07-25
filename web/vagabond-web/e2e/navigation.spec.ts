import { expect, test } from "@playwright/test";

import { apiDelete, apiGet, apiPost } from "./helpers/api";
import { uniqueName } from "./helpers/test-data";

type Rig = { id: string };

test.describe("navigation", () => {
  test.beforeEach(async ({ request }) => {
    const rigs = await apiGet<Rig[]>(request, "/rigs");
    for (const rig of rigs) {
      await apiDelete(request, `/rigs/${rig.id}`);
    }
  });

  test("home redirects to rig when no rig exists", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/rig\/?$/);
    await expect(page.getByText("Your Rig")).toBeVisible();
  });

  test("home redirects to trips when a rig exists", async ({ page, request }) => {
    await apiPost(request, "/rigs", {
      name: uniqueName("nav-rig"),
      make: "Toyota",
      model: "4Runner",
      year: 2020,
      fuel_capacity_gal: null,
      battery_capacity_wh: null,
      solar_peak_watts: null,
      notes: null,
    });

    await page.goto("/");
    await expect(page).toHaveURL(/\/trips\/?$/);
    await expect(page.getByRole("heading", { name: "Trips", exact: true })).toBeVisible();
  });

  test("product nav Trips opens the live trip list", async ({ page }) => {
    await page.goto("/rig");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Trips", exact: true }).click();
    await expect(page).toHaveURL(/\/trips\/?$/);
    await expect(page.getByRole("heading", { name: "Trips", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Trip" })).toBeVisible();
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
