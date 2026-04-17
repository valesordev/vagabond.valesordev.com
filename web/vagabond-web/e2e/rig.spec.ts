import { expect, test } from "@playwright/test";

import { apiDelete, apiGet } from "./helpers/api";
import { uniqueName } from "./helpers/test-data";
import { waitForSavingStateToSettle } from "./helpers/waits";

type Rig = { id: string };
type GearItem = { id: string };

test.describe("Rig and Gear CRUD", () => {
  test.beforeEach(async ({ request }) => {
    const rigs = await apiGet<Rig[]>(request, "/rigs");
    for (const rig of rigs) {
      await apiDelete(request, `/rigs/${rig.id}`);
    }
  });

  test("creates rig, updates profile, and manages gear", async ({ page, request }) => {
    const rigName = uniqueName("rig");
    const updatedRigName = `${rigName}-updated`;
    const gearName = uniqueName("gear");
    const editedGearName = `${gearName}-edited`;

    await page.goto("/rig");
    await expect(page.getByText("Your Rig")).toBeVisible();

    await page.getByRole("button", { name: "+ Create Rig Profile" }).click();
    await page.locator("#rig-name").fill(rigName);
    await page.locator("#rig-make").fill("Toyota");
    await page.locator("#rig-model").fill("4Runner");
    await page.locator("#rig-year").fill("2020");
    await page.locator("#rig-fuel").fill("23");
    await page.locator("#rig-notes").fill("Rig created by Playwright");
    await page.getByRole("button", { name: "Create Rig" }).click();

    await expect(page.getByRole("heading", { name: "Rig" })).toBeVisible();
    await expect(page.getByRole("button", { name: rigName })).toBeVisible();

    await page.getByRole("button", { name: rigName }).click();
    await page.getByRole("textbox").first().fill(updatedRigName);
    await page.keyboard.press("Enter");
    await waitForSavingStateToSettle(page);
    await expect(page.getByRole("button", { name: updatedRigName })).toBeVisible();

    await page.getByRole("button", { name: "Add gear" }).first().click();
    await page.locator("#add-gear-name").fill(gearName);
    await page.locator("#add-gear-category").fill("Kitchen");
    await page.locator("#add-gear-weight").fill("48");
    await page.locator("#add-gear-notes").fill("Added by E2E");
    await page.getByRole("dialog").getByRole("button", { name: "Add gear" }).click();
    await expect(page.getByRole("cell", { name: gearName })).toBeVisible();

    const row = page.locator("tr").filter({ hasText: gearName });
    await row.getByRole("button", { name: "Edit" }).click();
    await page.locator("#edit-gear-name").fill(editedGearName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("cell", { name: editedGearName })).toBeVisible();

    const editedRow = page.locator("tr").filter({ hasText: editedGearName });
    await editedRow.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(editedGearName)).toHaveCount(0);

    const rigs = await apiGet<Rig[]>(request, "/rigs");
    expect(rigs.length).toBe(1);
    const gear = await apiGet<GearItem[]>(request, `/rigs/${rigs[0].id}/gear`);
    expect(gear).toHaveLength(0);
  });
});
