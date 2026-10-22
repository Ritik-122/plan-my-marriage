import { expect, test } from "@playwright/test";
import mongoose from "mongoose";

const headers = { Origin: "http://127.0.0.1:3111" };
const password = "Wedding integration test 2027!";
test("wizard saves a draft, creates, and edits a persisted wedding", async ({
  page,
  context,
}) => {
  expect(
    (
      await context.request.post("/api/v1/auth/register", {
        headers,
        data: {
          displayName: "Wedding Owner",
          email: "wizard@example.com",
          password,
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/app/weddings/new");
  await page.getByRole("button", { name: /Continue to Style/ }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "check your wedding details",
  );
  await page.locator("#brideName").fill("Priya");
  await page.locator("#groomName").fill("Ritik");
  await page.locator("#weddingDate").fill("2027-12-12");
  await page.locator("#city").fill("Udaipur");
  await page.locator("#slug").fill("our-wedding-test");
  await page.locator("#groomName").fill("Ritik Kumar");
  await expect(page.locator("#slug")).toHaveValue("our-wedding-test");
  await page.getByRole("button", { name: "Save & Exit" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/weddings/new");
  await expect(page.locator("#city")).toHaveValue("Udaipur");
  for (let step = 1; step <= 3; step++) {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: `test-results/wedding-step-${step}-${width}.png`,
        fullPage: true,
      });
    }
    if (step === 1)
      await page.getByRole("button", { name: /Continue to Style/ }).click();
    if (step === 2) {
      await page.getByRole("radio", { name: /Royal Indian/ }).check();
      await page.getByRole("button", { name: /Continue to Review/ }).click();
    }
  }
  await page
    .getByRole("button", { name: /Create Our Wedding Workspace/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your wedding workspace is ready." }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Open Wedding Dashboard/ }).click();
  await expect(page).toHaveURL(/\/app\/weddings\/[a-f0-9]+$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Priya & Ritik Kumar" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Edit/ }).click();
  await page.locator("#city").fill("Jaipur");
  await page.getByRole("button", { name: /Save/ }).click();
  await expect(page).toHaveURL(/\/app\/weddings\/[a-f0-9]+$/);
  await page.reload();
  await expect(page.getByText("Jaipur", { exact: true })).toBeVisible();
});

test("wedding API enforces membership, unique handles and transaction rollback", async ({
  playwright,
}) => {
  const owner = await playwright.request.newContext({
    baseURL: headers.Origin,
  });
  const outsider = await playwright.request.newContext({
    baseURL: headers.Origin,
  });
  const uri = process.env.PMM_TEST_MONGODB_URI;
  if (!uri?.startsWith("mongodb://127.0.0.1:"))
    throw new Error("Disposable database required");
  const connection = await mongoose
    .createConnection(uri, { dbName: "pmm_auth_test" })
    .asPromise();
  const db = connection.db!;
  try {
    for (const [client, email] of [
      [owner, "owner@example.com"],
      [outsider, "outsider@example.com"],
    ] as const)
      expect(
        (
          await client.post("/api/v1/auth/register", {
            headers,
            data: { displayName: "API Tester", email, password },
          })
        ).status(),
      ).toBe(201);
    const data = {
      brideName: "Priya",
      groomName: "Ritik",
      city: "Delhi",
      weddingDate: "2027-12-12T06:30:00.000Z",
      slug: "unique-wedding",
      theme: "CLASSIC_INDIAN",
      description: "Keep this note",
    };
    const race = await Promise.all([
      owner.post("/api/v1/weddings", { headers, data }),
      owner.post("/api/v1/weddings", { headers, data }),
    ]);
    expect(race.map((r) => r.status()).sort()).toEqual([201, 409]);
    const wedding = (await race.find((r) => r.status() === 201)!.json()).data;
    expect(wedding.role).toBe("ADMIN");
    expect(wedding.website.isPublished).toBe(false);
    const path = `/api/v1/weddings/${wedding.id}`;
    expect((await outsider.get(path)).status()).toBe(404);
    expect(
      (
        await outsider.patch(path, { headers, data: { city: "Mumbai" } })
      ).status(),
    ).toBe(404);
    expect(
      (await (await outsider.get("/api/v1/weddings")).json()).data,
    ).toEqual([]);
    expect(
      (
        await owner.patch(path, { headers, data: { theme: "ROYAL_INDIAN" } })
      ).status(),
    ).toBe(200);
    expect((await (await owner.get(path)).json()).data.description).toBe(
      "Keep this note",
    );
    expect(
      (
        await owner.patch(path, { headers, data: { slug: "changed" } })
      ).status(),
    ).toBe(400);
    expect(
      (
        await owner.patch(path, {
          headers,
          data: { website: { isPublished: true } },
        })
      ).status(),
    ).toBe(400);
    await db.command({
      collMod: "weddingMembers",
      validator: { role: { $eq: "MANAGER" } },
      validationLevel: "strict",
    });
    try {
      expect(
        (
          await owner.post("/api/v1/weddings", {
            headers,
            data: { ...data, slug: "rollback-wedding" },
          })
        ).status(),
      ).toBe(503);
      expect(
        await db
          .collection("weddings")
          .countDocuments({ slug: "rollback-wedding" }),
      ).toBe(0);
    } finally {
      await db.command({ collMod: "weddingMembers", validator: {} });
    }
    expect(
      await db
        .collection("weddingMembers")
        .countDocuments({ weddingId: new mongoose.Types.ObjectId(wedding.id) }),
    ).toBe(1);
  } finally {
    await connection.close();
    await owner.dispose();
    await outsider.dispose();
  }
});
