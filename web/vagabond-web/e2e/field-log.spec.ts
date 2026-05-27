import { expect, test } from "@playwright/test";

import { apiPost } from "./helpers/api";
import { todayLocalIsoDate, uniqueName } from "./helpers/test-data";

type Trip = { id: string; name: string };

test.describe("Field log CRUD", () => {
  let tripId: string;

  test.beforeEach(async ({ request }) => {
    const trip = await apiPost<Trip>(request, "/trips", {
      name: uniqueName("trip-log"),
      description: "Field log test fixture",
    });
    tripId = trip.id;
  });

  test("trip overview links to field log with day count", async ({ page }) => {
    await page.goto(`/trips/${tripId}`);
    await expect(page.getByRole("link", { name: /Field log · 0 days/ })).toBeVisible();
  });

  test("creates, edits, and deletes a field log entry", async ({ page }) => {
    const logDate = todayLocalIsoDate();
    const initialNotes = "Initial field log from Playwright";
    const updatedNotes = "Updated field log from Playwright";
    const newEntryButton = page.getByRole("button", { name: "+ New Entry" }).first();

    await page.goto(`/trips/${tripId}/log`);
    await expect(newEntryButton).toBeVisible();

    await newEntryButton.click();
    await expect(page.getByRole("heading", { name: "New log entry" })).toBeVisible();

    await page.locator("#field-log-date").fill(logDate);
    await page.locator("#field-log-notes").fill(initialNotes);
    await page.locator("#field-log-power").fill("250");
    await page.locator("#field-log-water").fill("1.5");
    await page.locator("#field-log-weather").fill("Clear");
    await page.getByRole("button", { name: "Save entry" }).click();

    await expect(page.getByText(initialNotes)).toBeVisible();

    const card = page.locator("li").filter({ hasText: initialNotes }).first();
    await card.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit log entry" })).toBeVisible();
    await page.locator("#field-log-notes").fill(updatedNotes);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(updatedNotes)).toBeVisible();

    const updatedCard = page.locator("li").filter({ hasText: updatedNotes }).first();
    await updatedCard.getByRole("button", { name: "Delete" }).click();
    await updatedCard.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.getByText(updatedNotes)).toHaveCount(0);
  });
});
