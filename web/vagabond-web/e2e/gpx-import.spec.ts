import { expect, test } from "@playwright/test";
import path from "node:path";

import { apiDelete, apiPost } from "./helpers/api";
import { uniqueName } from "./helpers/test-data";

type Trip = {
  id: string;
};

test.describe("GPX import", () => {
  let tripId: string | null = null;

  test.beforeEach(async ({ request }) => {
    const trip = await apiPost<Trip>(request, "/trips", {
      name: uniqueName("trip-gpx"),
      description: "Trip for GPX import test",
    });
    tripId = trip.id;
  });

  test.afterEach(async ({ request }) => {
    if (tripId) {
      await apiDelete(request, `/trips/${tripId}`);
      tripId = null;
    }
  });

  test("imports a GPX file and shows success banner", async ({ page }) => {
    if (!tripId) {
      throw new Error("Trip ID not initialized");
    }

    const gpxFilePath = path.resolve(process.cwd(), "e2e/fixtures/sample.gpx");

    await page.goto(`/trips/${tripId}`);
    await expect(page.getByRole("button", { name: "+ Add Waypoint" })).toBeVisible();

    await page.getByRole("button", { name: "Import GPX" }).click();
    await page.setInputFiles('input[type="file"][accept=".gpx"]', gpxFilePath);

    await expect(page.getByRole("heading", { name: /Import GPX/i })).toBeVisible();
    await page.getByRole("button", { name: /import/i }).click();

    await expect(page.getByText(/Kelso Dunes Loop|waypoints added/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Baker")).toBeVisible();
  });
});
