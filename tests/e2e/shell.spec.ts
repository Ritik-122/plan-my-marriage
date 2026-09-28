import { expect, test } from "@playwright/test";

test("landing navigation and coming-soon dialog work", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Plan the wedding. Together." }),
  ).toBeVisible();
  const trigger = page
    .getByRole("button", { name: "Start Planning — Free" })
    .first();
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Themes" })
    .click();
  await expect(page).toHaveURL(/#themes$/);
});

for (const width of [320, 375, 768, 1440]) {
  test(`landing fits a ${width}px viewport`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    if (width < 1024) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: "Features" })
        .click();
      await expect(
        page.getByRole("button", { name: "Menu", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
    }
    await page.locator("#memories").scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator("#memories img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `test-results/landing-${width}.png`,
      fullPage: true,
    });
  });
}

test("sample actions explain that the product is coming soon", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Contact via WhatsApp" })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Back to exploring" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
