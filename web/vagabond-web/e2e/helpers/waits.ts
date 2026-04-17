import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function waitForSavingStateToSettle(page: Page): Promise<void> {
  const statusLine = page.getByText(/Saving\.\.\.|Saved|Failed|Name is required\./).first();
  await statusLine.waitFor({ state: "visible", timeout: 10_000 });
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10_000 });
}

export async function clickAndWaitForDialogToClose(button: Locator, dialogTitle: Locator): Promise<void> {
  await button.click();
  await expect(dialogTitle).toBeHidden({ timeout: 10_000 });
}
