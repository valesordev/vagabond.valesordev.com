import { expect, test } from "@playwright/test";

import { uniqueName } from "./helpers/test-data";
import { waitForSavingStateToSettle } from "./helpers/waits";

test.describe("Trips CRUD", () => {
  test("creates, edits, and deletes a trip", async ({ page }) => {
    const initialName = uniqueName("trip");
    const updatedName = `${initialName}-updated`;
    const updatedDescription = "Updated by Playwright MVP test";

    await page.goto("/trips");
    await expect(page.getByRole("heading", { name: "Trips" })).toBeVisible();

    await page.getByRole("button", { name: "New Trip" }).click();
    await expect(page.getByRole("heading", { name: "New Trip" })).toBeVisible();

    await page.locator("#trip-name").fill(initialName);
    await page.locator("#trip-description").fill("Trip created by Playwright");
    await page.getByRole("button", { name: "Create Trip" }).click();

    await expect(page).toHaveURL(/\/trips\/[^/]+$/);
    await expect(page.getByRole("button", { name: initialName })).toBeVisible();

    await page.getByRole("button", { name: initialName }).click();
    const nameInput = page.locator("input").first();
    await nameInput.fill(updatedName);
    await nameInput.press("Enter");
    await waitForSavingStateToSettle(page);
    await expect(page.getByRole("button", { name: updatedName })).toBeVisible();

    await page.getByRole("button", { name: "Trip created by Playwright" }).click();
    await page.locator("textarea").first().fill(updatedDescription);
    await page.keyboard.press("Enter");
    await waitForSavingStateToSettle(page);
    await expect(page.getByRole("button", { name: updatedDescription })).toBeVisible();

    await page.getByRole("button", { name: "Delete Trip" }).click();
    await expect(page.getByRole("heading", { name: "Delete trip?" })).toBeVisible();
    await page.getByRole("button", { name: "Delete Trip" }).last().click();

    await expect(page).toHaveURL(/\/trips$/);
    await expect(page.getByText(updatedName)).toHaveCount(0);
  });
});
