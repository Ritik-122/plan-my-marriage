import { expect, test, type BrowserContext } from "@playwright/test";
import mongoose from "mongoose";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
const origin = "http://127.0.0.1:3111";
const headers = { Origin: origin };
test.beforeAll(async () => {
  const uri = process.env.PMM_TEST_MONGODB_URI;
  if (!uri?.startsWith("mongodb://127.0.0.1:"))
    throw new Error("Disposable database required");
  await mongoose.connect(uri, { dbName: "pmm_auth_test" });
});
test.afterAll(async () => {
  await mongoose.disconnect();
});
async function account(context: BrowserContext) {
  const _id = new mongoose.Types.ObjectId();
  await mongoose.connection.db!.collection("users").insertOne({
    _id,
    email: `${randomUUID()}@example.com`,
    displayName: "Website tester",
    passwordHash: "unused-test-session",
    sessionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const token = await new SignJWT({ sessionVersion: 1 })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(_id.toString())
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("plan-my-marriage")
    .setAudience("pmm-app")
    .sign(new TextEncoder().encode(process.env.PMM_TEST_SESSION_SECRET));
  await context.addCookies([
    {
      name: "pmm_session",
      value: token,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return _id;
}
async function setup(context: BrowserContext) {
  await account(context);
  const slug = `website-${randomUUID().slice(0, 8)}`;
  const response = await context.request.post("/api/v1/weddings", {
    headers,
    data: {
      brideName: "Vandana",
      groomName: "Ritik",
      city: "New Delhi",
      weddingDate: "2027-02-07T06:30:00Z",
      slug,
      theme: "CLASSIC_INDIAN",
      description: "Join our family celebrations.",
    },
  });
  expect(response.status()).toBe(201);
  const weddingId = (await response.json()).data.id;
  const base = `/api/v1/weddings/${weddingId}`;
  const ids: string[] = [];
  for (const [name, visibility] of [
    ["Public Sangeet", "PUBLIC"],
    ["Secret Haldi", "INVITED_ONLY"],
  ]) {
    const event = await context.request.post(`${base}/events`, {
      headers,
      data: {
        name,
        visibility,
        type: "CUSTOM",
        startsAt: "2027-02-06T13:30:00Z",
        dressCode: "Festive Indian",
        venue: {
          name: "The Courtyard",
          address: "New Delhi",
          mapUrl: "https://maps.google.com/?q=Delhi",
        },
        description: "Music and celebrations.",
      },
    });
    expect(event.status()).toBe(201);
    ids.push((await event.json()).data.id);
  }
  return {
    base,
    slug,
    weddingId,
    ids,
    publicApi: `/api/v1/public/weddings/${slug}`,
  };
}

test("publication respects privacy, live event visibility, membership and independent RSVP", async ({
  context,
  browser,
  playwright,
}) => {
  const { base, slug, weddingId, ids, publicApi } = await setup(context);
  const request = context.request;
  const anon = await playwright.request.newContext({ baseURL: origin });
  const outsider = await browser.newContext({ baseURL: origin });
  await account(outsider);
  const manager = await browser.newContext({ baseURL: origin });
  const managerId = await account(manager);
  try {
    for (const url of [
      publicApi,
      `${publicApi}?preview=true`,
      "/api/v1/public/weddings/no-such-wedding",
    ])
      expect((await anon.get(url)).status()).toBe(404);
    expect((await anon.get(`${base}/website/preview`)).status()).toBe(401);
    expect(
      (await outsider.request.get(`${base}/website/preview`)).status(),
    ).toBe(404);
    expect(
      (
        await outsider.request.patch(base, {
          headers,
          data: { website: { isPublished: true } },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await anon.patch(base, {
          headers,
          data: { website: { isPublished: true } },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await request.patch(base, {
          headers: { Origin: "https://evil.example" },
          data: { website: { isPublished: true } },
        })
      ).status(),
    ).toBe(403);
    for (const website of [
      {},
      { isPublished: "true" },
      { isPublished: true, showGallery: true },
    ])
      expect(
        (await request.patch(base, { headers, data: { website } })).status(),
      ).toBe(400);
    const preview = await request.get(`${base}/website/preview`);
    expect(preview.status()).toBe(200);
    expect(
      (await preview.json()).data.events.map((e: { name: string }) => e.name),
    ).toEqual(["Public Sangeet"]);
    expect(preview.headers()["cache-control"]).toContain("no-store");
    const guest = (
      await (
        await request.post(`${base}/guests`, {
          headers,
          data: {
            name: "Private guest",
            email: "private-contact@example.com",
            notes: "Confidential note",
          },
        })
      ).json()
    ).data;
    expect(
      (
        await request.post(`${base}/events/${ids[1]}/guests`, {
          headers,
          data: { guestIds: [guest.id] },
        })
      ).status(),
    ).toBe(200);
    const invitation = (
      await (
        await request.post(`${base}/guests/${guest.id}/access-links`, {
          headers,
          data: { expiresAt: new Date(Date.now() + 86400000).toISOString() },
        })
      ).json()
    ).data;
    const token = new URL(invitation.url).pathname.split("/").at(-1)!;
    const auth = { ...headers, Authorization: `Bearer ${token}` };
    const publish = await request.patch(base, {
      headers,
      data: { website: { isPublished: true } },
    });
    expect(publish.status()).toBe(200);
    expect((await publish.json()).data.website).toEqual({
      isPublished: true,
      showGallery: true,
      showLivestream: true,
    });
    const published = await anon.get(publicApi);
    expect(published.status()).toBe(200);
    expect(published.headers()["cache-control"]).toContain("no-store");
    const result = (await published.json()).data;
    expect(result.events).toHaveLength(1);
    for (const secret of [
      "Secret Haldi",
      "Private guest",
      "private-contact",
      "Confidential note",
      "createdBy",
      "role",
      "rsvpStatus",
      "expense",
      token,
    ])
      expect(JSON.stringify(result)).not.toContain(secret);
    expect(result.events[0].venue.mapUrl).toBe(
      "https://maps.google.com/?q=Delhi",
    );
    for (const theme of ["MODERN_MINIMAL", "ROYAL_INDIAN", "CLASSIC_INDIAN"]) {
      expect(
        (await request.patch(base, { headers, data: { theme } })).status(),
      ).toBe(200);
      expect((await (await anon.get(publicApi)).json()).data.theme).toBe(theme);
    }
    expect(
      (
        await request.patch(`${base}/events/${ids[0]}`, {
          headers,
          data: { visibility: "INVITED_ONLY" },
        })
      ).status(),
    ).toBe(200);
    expect((await (await anon.get(publicApi)).json()).data.events).toEqual([]);
    expect(
      (
        await request.patch(`${base}/events/${ids[0]}`, {
          headers,
          data: { visibility: "PUBLIC" },
        })
      ).status(),
    ).toBe(200);
    const membership = await mongoose.connection
      .db!.collection("weddingMembers")
      .insertOne({
        weddingId: new mongoose.Types.ObjectId(weddingId),
        userId: managerId,
        role: "MANAGER",
        joinedAt: new Date(),
      });
    expect(
      (await manager.request.get(`${base}/website/preview`)).status(),
    ).toBe(200);
    expect(
      (
        await manager.request.patch(base, {
          headers,
          data: { website: { isPublished: false } },
        })
      ).status(),
    ).toBe(200);
    expect((await anon.get(publicApi)).status()).toBe(404);
    const hiddenPage = await anon.get(`/w/${slug}`);
    expect(await hiddenPage.text()).not.toContain("Public Sangeet");
    expect(await hiddenPage.text()).not.toContain("Vandana");
    expect(hiddenPage.headers()["cache-control"]).toContain("no-store");
    expect(
      (await anon.get("/api/v1/guest/invitation", { headers: auth })).status(),
    ).toBe(200);
    expect(
      (
        await anon.patch("/api/v1/guest/rsvps", {
          headers: auth,
          data: { responses: [{ eventId: ids[1], status: "ATTENDING" }] },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await request.delete(`${base}/members/${membership.insertedId}`, {
          headers,
        })
      ).status(),
    ).toBe(204);
    expect(
      (
        await manager.request.patch(base, {
          headers,
          data: { website: { isPublished: true } },
        })
      ).status(),
    ).toBe(404);
    expect((await anon.get(publicApi)).status()).toBe(404);
    expect(
      (
        await request.patch(base, {
          headers,
          data: { website: { isPublished: true } },
        })
      ).status(),
    ).toBe(200);
    expect((await anon.get(publicApi)).status()).toBe(200);
  } finally {
    await anon.dispose();
    await outsider.close();
    await manager.close();
  }
});

test("website management previews all themes, publishes with confirmation and unpublishes", async ({
  context,
  page,
  browser,
}, testInfo) => {
  test.setTimeout(120_000);
  const { weddingId, base, slug } = await setup(context);
  const path = `/app/weddings/${weddingId}/website`;
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Wedding Website", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Unpublished", { exact: true })).toBeVisible();
  await page
    .getByLabel("Your message to guests")
    .fill("We are delighted to celebrate with you!");
  await page.getByRole("button", { name: "Save welcome note" }).click();
  await expect(page.getByRole("status")).toHaveText("Website changes saved.");
  await page.reload();
  await expect(page.getByLabel("Your message to guests")).toHaveValue(
    "We are delighted to celebrate with you!",
  );
  const visitor = await browser.newContext({ baseURL: origin });
  const guestPage = await visitor.newPage();
  await guestPage.goto(`/w/${slug}`);
  await expect(
    guestPage.getByRole("heading", { name: "This website is unavailable" }),
  ).toBeVisible();
  await guestPage.goto(`${path}/preview`);
  await expect(guestPage).toHaveURL(/\/sign-in$/);
  const previewPage = await context.newPage();
  await previewPage.goto(`${path}/preview`);
  await expect(
    previewPage.getByRole("heading", { name: "Ritik", exact: false }).first(),
  ).toBeVisible();
  await expect(previewPage.getByText("Secret Haldi")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Publish website", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Confirm publish" }),
  ).toBeDisabled();
  await dialog.getByRole("checkbox").check();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({
    path: testInfo.outputPath("publish-mobile.png"),
    fullPage: true,
  });
  await page.route(`**${base}`, (route) =>
    route.request().method() === "PATCH"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "Temporary publication failure" },
          }),
        })
      : route.continue(),
  );
  await dialog.getByRole("button", { name: "Confirm publish" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Temporary publication failure",
  );
  await page.unroute(`**${base}`);
  await dialog.getByRole("button", { name: "Confirm publish" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText("Published · Live", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`website-manager-${width}.png`),
      fullPage: true,
    });
  }
  for (const [theme, name] of [
    ["CLASSIC_INDIAN", "Classic Indian"],
    ["MODERN_MINIMAL", "Modern Minimal"],
    ["ROYAL_INDIAN", "Royal Indian"],
  ]) {
    const button = page.getByRole("button", { name: `Apply ${name} theme` });
    await button.click();
    await expect(page.getByRole("status")).toHaveText("Website changes saved.");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await guestPage.goto(`/w/${slug}`);
    await expect(guestPage.locator(`[data-theme="${theme}"]`)).toBeVisible();
    await expect(
      guestPage.getByText("We are delighted to celebrate with you!"),
    ).toBeVisible();
    await expect(guestPage.getByText("Secret Haldi")).toHaveCount(0);
    await expect(
      guestPage.getByRole("heading", { name: "Public Sangeet" }),
    ).toBeVisible();
    for (const width of [320, 1440]) {
      await guestPage.setViewportSize({ width, height: 950 });
      expect(
        await guestPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await guestPage.screenshot({
        path: testInfo.outputPath(`website-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page
    .getByRole("button", { name: "Unpublish website", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Keep website live" }).click();
  await expect(
    page.getByText("Published · Live", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Unpublish website", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Confirm unpublish" }).click();
  await expect(page.getByText("Unpublished", { exact: true })).toBeVisible();
  await guestPage.reload();
  await expect(
    guestPage.getByRole("heading", { name: "This website is unavailable" }),
  ).toBeVisible();
  await expect(guestPage.getByText("Public Sangeet")).toHaveCount(0);
  await previewPage.reload();
  await expect(
    previewPage.getByRole("heading", { name: "Public Sangeet" }),
  ).toBeVisible();
  await previewPage.close();
  await visitor.close();
});
