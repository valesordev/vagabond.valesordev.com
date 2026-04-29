import { expect, test as setup } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const WEB_PORT =
  process.env.PLAYWRIGHT_AUTH_WEB_PORT ?? process.env.PLAYWRIGHT_WEB_PORT ?? "3200";
const AUTH_FILE = path.resolve(process.cwd(), ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const authDir = path.resolve(process.cwd(), ".auth");
  await fs.mkdir(authDir, { recursive: true });

  if (process.env.PLAYWRIGHT_RUN_AUTH_TESTS !== "true") {
    await fs.writeFile(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }, null, 2), "utf8");
    return;
  }

  await page.goto(`http://127.0.0.1:${WEB_PORT}/trips`);
  // App auth starts at NextAuth sign-in, then redirects to Keycloak.
  // Retry click/navigation once because auth services can come up slightly behind web startup.
  const signInButton = page.getByRole("button", { name: /sign in with keycloak/i });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (await page.locator("#username").isVisible()) {
      break;
    }
    await expect(signInButton).toBeVisible({ timeout: 10_000 });
    await signInButton.click();
    try {
      await page.waitForURL(/realms\/vagabond/i, { timeout: 10_000 });
      break;
    } catch {
      // Retry one more time when Keycloak redirect races startup.
    }
  }

  await expect(page.locator("#username")).toBeVisible({ timeout: 15_000 });
  await page.locator("#username").fill("vagabond-dev");
  await page.locator("#password").fill("vagabond-dev");
  await page.locator("#kc-login").click();

  // Fresh Keycloak dev users can be forced through profile completion.
  // Handle it so auth setup remains deterministic across environments.
  const updateProfileHeading = page.getByRole("heading", { name: /update account information/i });
  if (await updateProfileHeading.isVisible()) {
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await emailInput.fill("vagabond-dev@example.com");
    await page.getByRole("button", { name: /^submit$/i }).click();
  }

  await page.waitForURL(/\/trips/);
  await page.context().storageState({ path: AUTH_FILE });
});
