import { expect, test } from "@playwright/test";

test("minimal shell renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Plan My Marriage" }),
  ).toBeVisible();
});
