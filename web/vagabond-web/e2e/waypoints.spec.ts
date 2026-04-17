import { expect, test } from "@playwright/test";

import { apiGet, apiPost } from "./helpers/api";
import { uniqueName } from "./helpers/test-data";

type Trip = { id: string; name: string };
type TripLeg = { id: string };

test.describe("Waypoint CRUD", () => {
  let tripId: string;

  test.beforeEach(async ({ request }) => {
    const trip = await apiPost<Trip>(request, "/trips", {
      name: uniqueName("trip-waypoint"),
      description: "Waypoint test fixture",
    });
    tripId = trip.id;
  });

  test("adds and deletes a waypoint from trip detail", async ({ page }) => {
    const waypointName = uniqueName("waypoint");

    await page.goto(`/trips/${tripId}`);
    await expect(page.getByRole("button", { name: "+ Add Waypoint" })).toBeVisible();

    await page.getByRole("button", { name: "+ Add Waypoint" }).click();
    await expect(page.getByText("Click the map to place a waypoint.")).toBeVisible();

    const mapCanvas = page.locator(".maplibregl-canvas");
    await expect(mapCanvas).toBeVisible({ timeout: 20_000 });
    await mapCanvas.click({ position: { x: 120, y: 120 } });

    await expect(page.getByRole("heading", { name: "Add waypoint" })).toBeVisible();
    await page.locator("#waypoint-name").fill(waypointName);
    await page.locator("#waypoint-notes").fill("Waypoint from Playwright");
    await page.getByRole("button", { name: "Save waypoint" }).click();

    await expect(page.getByText(waypointName)).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${waypointName}` }).click();
    await expect(page.getByText(waypointName)).toHaveCount(0);

    const legs = await apiGet<TripLeg[]>(page.request, `/trips/${tripId}/legs`);
    expect(legs.length).toBeGreaterThan(0);
  });
});
