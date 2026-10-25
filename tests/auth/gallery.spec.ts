import { expect, test, type BrowserContext } from "@playwright/test";
import mongoose from "mongoose";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
const origin = "http://127.0.0.1:3111";
const headers = { Origin: origin };
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
  "base64",
);
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
    displayName: "Gallery tester",
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
  const userId = await account(context);
  const response = await context.request.post("/api/v1/weddings", {
    headers,
    data: {
      brideName: "Vandana",
      groomName: "Ritik",
      city: "New Delhi",
      weddingDate: "2027-02-07T06:30:00Z",
      slug: `gallery-${randomUUID().slice(0, 8)}`,
      theme: "CLASSIC_INDIAN",
    },
  });
  expect(response.status()).toBe(201);
  const weddingId = (await response.json()).data.id;
  const base = `/api/v1/weddings/${weddingId}`;
  const event = await context.request.post(`${base}/events`, {
    headers,
    data: {
      name: "Sangeet night",
      type: "SANGEET",
      visibility: "INVITED_ONLY",
      startsAt: "2027-02-06T13:30:00Z",
      venue: { name: "The Courtyard", address: "New Delhi" },
    },
  });
  expect(event.status()).toBe(201);
  return {
    weddingId,
    base,
    userId,
    eventId: (await event.json()).data.id as string,
  };
}
async function presign(
  context: BrowserContext,
  base: string,
  eventId: string | null,
  name = "celebration.png",
  bytes = png,
  mimeType = "image/png",
) {
  const scope = {
    eventId,
    purpose: eventId ? "EVENT_GALLERY" : "WEDDING_GALLERY",
  };
  const response = await context.request.post(`${base}/uploads/presign`, {
    headers,
    data: { ...scope, fileName: name, mimeType, sizeBytes: bytes.length },
  });
  expect(response.status()).toBe(200);
  const intent = (await response.json()).data;
  return {
    intent,
    finalize: { ...scope, objectKey: intent.objectKey, originalFileName: name },
    bytes,
  };
}
async function upload(
  context: BrowserContext,
  base: string,
  eventId: string | null,
  name = "celebration.png",
) {
  const data = await presign(context, base, eventId, name);
  const put = await context.request.put(data.intent.uploadUrl, {
    headers: data.intent.requiredHeaders,
    data: data.bytes,
  });
  expect(put.status()).toBe(200);
  const response = await context.request.post(`${base}/uploads/finalize`, {
    headers,
    data: data.finalize,
  });
  expect(response.status()).toBe(201);
  return { ...data, photo: (await response.json()).data.photo };
}
test("gallery verifies storage, scopes permissions, handles retries and deletes safely", async ({
  context,
  browser,
}) => {
  const { base, weddingId, eventId } = await setup(context);
  const outsider = await browser.newContext({ baseURL: origin });
  const other = await setup(outsider);
  expect((await outsider.request.get(`${base}/photos`)).status()).toBe(404);
  expect(
    (
      await context.request.post(`${base}/uploads/presign`, {
        headers: { Origin: "https://evil.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  for (const changes of [
    { mimeType: "image/svg+xml" },
    { sizeBytes: 10485761 },
    { uploadedByType: "ADMIN" },
    { eventId: other.eventId },
  ]) {
    expect(
      (
        await context.request.post(`${base}/uploads/presign`, {
          headers,
          data: {
            purpose: "EVENT_GALLERY",
            eventId,
            fileName: "a.png",
            sizeBytes: png.length,
            mimeType: "image/png",
            ...changes,
          },
        })
      ).status(),
    ).toBe(400);
  }
  const pending = await presign(context, base, eventId);
  expect(
    (
      await context.request.post(`${base}/uploads/finalize`, {
        headers,
        data: pending.finalize,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await context.request.post(`${base}/uploads/finalize`, {
        headers,
        data: { ...pending.finalize, originalFileName: "forged.png" },
      })
    ).status(),
  ).toBe(400);
  const put = await context.request.put(pending.intent.uploadUrl, {
    headers: pending.intent.requiredHeaders,
    data: pending.bytes,
  });
  expect(put.status()).toBe(200);
  const results = await Promise.all(
    [1, 2].map(() =>
      context.request.post(`${base}/uploads/finalize`, {
        headers,
        data: pending.finalize,
      }),
    ),
  );
  for (const result of results) expect(result.status()).toBe(201);
  const first = (await results[0].json()).data.photo;
  expect((await results[1].json()).data.photo.id).toBe(first.id);
  expect(first.uploadedByType).toBe("ADMIN");
  expect(first).not.toHaveProperty("objectKey");
  expect(first).not.toHaveProperty("uploadedByUserId");
  expect((await context.request.get(first.url)).status()).toBe(200);
  expect(
    (
      await context.request.put(pending.intent.uploadUrl, {
        headers: pending.intent.requiredHeaders,
        data: png,
      })
    ).status(),
  ).toBe(412);
  expect(
    (await outsider.request.get(`${base}/photos/${first.id}`)).status(),
  ).toBe(404);
  expect(
    (
      await outsider.request.delete(`${base}/photos/${first.id}`, { headers })
    ).status(),
  ).toBe(404);
  expect(
    (
      await outsider.request.post(`${other.base}/uploads/finalize`, {
        headers,
        data: pending.finalize,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await context.request.delete(`${base}/events/${eventId}`, { headers })
    ).status(),
  ).toBe(409);
  // Actual bytes are checked independently of the browser's declaration.
  for (const [name, actual, type] of [
    ["wrong-size.png", png.subarray(0, 20), "image/png"],
    ["wrong-type.png", png, "text/plain"],
    ["wrong-signature.png", Buffer.alloc(png.length), "image/png"],
  ] as const) {
    const bad = await presign(context, base, null, name);
    expect(
      (
        await context.request.put(bad.intent.uploadUrl, {
          headers: { ...bad.intent.requiredHeaders, "Content-Type": type },
          data: actual,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await context.request.post(`${base}/uploads/finalize`, {
          headers,
          data: bad.finalize,
        })
      ).status(),
    ).toBe(400);
  }
  const manager = await browser.newContext({ baseURL: origin });
  const managerId = await account(manager);
  const membership = {
    _id: new mongoose.Types.ObjectId(),
    weddingId: new mongoose.Types.ObjectId(weddingId),
    userId: managerId,
    role: "MANAGER",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await mongoose.connection
    .db!.collection("weddingMembers")
    .insertOne(membership);
  const general = await upload(manager, base, null, "wedding.png");
  expect(general.photo.uploadedByType).toBe("MANAGER");
  const abandoned = await presign(manager, base, null, "removed.png");
  expect(
    (
      await manager.request.put(abandoned.intent.uploadUrl, {
        headers: abandoned.intent.requiredHeaders,
        data: png,
      })
    ).status(),
  ).toBe(200);
  await mongoose.connection
    .db!.collection("weddingMembers")
    .deleteOne({ _id: membership._id });
  expect(
    (
      await manager.request.post(`${base}/uploads/finalize`, {
        headers,
        data: abandoned.finalize,
      })
    ).status(),
  ).toBe(404);
  const list = await (
    await context.request.get(`${base}/photos?limit=1`)
  ).json();
  expect(list.data).toHaveLength(1);
  const secondPage = await (
    await context.request.get(
      `${base}/photos?limit=1&cursor=${list.meta.nextCursor}`,
    )
  ).json();
  expect(secondPage.data).toHaveLength(1);
  expect(secondPage.data[0].id).not.toBe(list.data[0].id);
  expect(
    (
      await (await context.request.get(`${base}/photos?eventId=general`)).json()
    ).data.map((row: { id: string }) => row.id),
  ).toEqual([general.photo.id]);
  expect(
    (
      await (
        await context.request.get(`${base}/photos?eventId=${eventId}`)
      ).json()
    ).data.map((row: { id: string }) => row.id),
  ).toEqual([first.id]);
  expect(
    (await (await context.request.get(`${base}/photos/summary`)).json()).data
      .count,
  ).toBe(2);
  expect(
    (await context.request.get(`${base}/photos?cursor=bad`)).status(),
  ).toBe(400);
  await context.request.post(
    `${process.env.PMM_TEST_MEDIA_URL}/__test/fail-delete`,
  );
  expect(
    (
      await context.request.delete(`${base}/photos/${first.id}`, { headers })
    ).status(),
  ).toBe(503);
  expect(
    (await context.request.get(`${base}/photos/${first.id}`)).status(),
  ).toBe(200);
  expect((await context.request.get(first.url)).status()).toBe(200);
  expect(
    (
      await context.request.delete(`${base}/photos/${first.id}`, { headers })
    ).status(),
  ).toBe(204);
  expect((await context.request.get(first.url)).status()).toBe(404);
  expect(
    (
      await context.request.post(`${base}/uploads/finalize`, {
        headers,
        data: pending.finalize,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await context.request.put(pending.intent.uploadUrl, {
        headers: pending.intent.requiredHeaders,
        data: png,
      })
    ).status(),
  ).toBe(412);
  expect(
    (
      await context.request.delete(`${base}/events/${eventId}`, { headers })
    ).status(),
  ).toBe(204);
  const deletedEventUpload = await presign(context, base, null, "expired.png");
  await mongoose.connection
    .db!.collection("photoUploadIntents")
    .updateOne(
      { objectKey: deletedEventUpload.intent.objectKey },
      { $set: { expiresAt: new Date(0) } },
    );
  expect(
    (
      await context.request.post(`${base}/uploads/finalize`, {
        headers,
        data: deletedEventUpload.finalize,
      })
    ).status(),
  ).toBe(404);
  await manager.close();
  await outsider.close();
});

test("gallery browser upload, lost-response retry, filters, viewer and confirmed deletion", async ({
  context,
  page,
}, testInfo) => {
  const { base, weddingId, eventId } = await setup(context);
  await page.goto(`/app/weddings/${weddingId}/gallery`);
  await expect(
    page.getByRole("heading", {
      name: "Every picture tells a part of your story",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Upload your first photos" }).click();
  const dialog = page.getByRole("dialog", { name: "Upload photos" });
  await dialog.getByLabel("Celebration", { exact: true }).selectOption(eventId);
  // Use an existing real photo for meaningful visual review.
  const bytes = await readFile("public/landing/sangeet.png");
  const isJpeg = bytes[0] === 255;
  const file = {
    name: isJpeg ? "Sangeet memories.jpg" : "Sangeet memories.png",
    mimeType: isJpeg ? "image/jpeg" : "image/png",
    buffer: bytes,
  };
  await dialog.getByLabel("Choose photos").setInputFiles([file]);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`gallery-upload-${width}.png`),
      fullPage: true,
    });
  }
  let lost = true;
  await page.route(`**${base}/uploads/finalize`, async (route) => {
    if (!lost) return route.continue();
    lost = false;
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { message: "Simulated lost confirmation." },
      }),
    });
  });
  await dialog
    .getByRole("button", { name: "Upload photos", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Simulated lost confirmation",
  );
  await dialog.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(dialog.getByText(/Saved to gallery/)).toBeVisible();
  expect(
    (await (await context.request.get(`${base}/photos/summary`)).json()).data
      .count,
  ).toBe(1);
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: `View ${file.name}`, exact: true }),
  ).toBeVisible();
  await upload(context, base, null, "Family.png");
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View Family.png", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sangeet night 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Family.png", exact: true }),
  ).toHaveCount(0);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`gallery-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: `View ${file.name}`, exact: true })
    .click();
  const viewer = page.getByRole("dialog", { name: "Your wedding memories" });
  await expect(
    viewer.getByRole("heading", { name: "Sangeet night" }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await viewer.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`gallery-viewer-${width}.png`),
      fullPage: true,
    });
  }
  await viewer
    .getByRole("button", { name: "Delete photo", exact: true })
    .click();
  await viewer.getByRole("button", { name: "Keep photo" }).click();
  await expect(
    viewer.getByText("Delete this photo?", { exact: true }),
  ).toHaveCount(0);
  await viewer
    .getByRole("button", { name: "Delete photo", exact: true })
    .click();
  await viewer.getByRole("button", { name: "Delete permanently" }).click();
  await expect(viewer).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `View ${file.name}`, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "This celebration is waiting for its photos",
    }),
  ).toBeVisible();
});
