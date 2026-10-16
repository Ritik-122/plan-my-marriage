import { expect, test } from "@playwright/test";
import mongoose from "mongoose";
const headers = { Origin: "http://127.0.0.1:3111" };
const wedding = {
  brideName: "Priya",
  groomName: "Ritik",
  city: "Udaipur",
  weddingDate: "2027-12-12T06:30:00Z",
  slug: "events-wedding",
  theme: "CLASSIC_INDIAN",
};
test("events support create, edit, chronological listing and confirmed delete on desktop and mobile", async ({
  page,
  context,
}) => {
  expect(
    (
      await context.request.post("/api/v1/auth/register", {
        headers,
        data: {
          displayName: "Event Planner",
          email: "events-ui@example.com",
          password: "Event planner password 2027!",
        },
      })
    ).status(),
  ).toBe(201);
  const response = await context.request.post("/api/v1/weddings", {
    headers,
    data: wedding,
  });
  expect(response.status()).toBe(201);
  const id = (await response.json()).data.id;
  const base = `/app/weddings/${id}/events`;
  await page.goto(base);
  await expect(page.getByText("Your celebrations start here.")).toBeVisible();
  await page.getByRole("link", { name: "Add your first event" }).click();
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Check",
  );
  await page.getByLabel("Event name *", { exact: true }).fill("Sangeet Night");
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: "Sangeet", exact: true }) })
    .click();
  await expect(
    page.getByRole("radio", { name: "Sangeet", exact: true }),
  ).toBeChecked();
  await page
    .getByLabel("Start date & time *", { exact: true })
    .fill("2027-12-11T19:00");
  await page
    .getByLabel("End date & time (optional)", { exact: true })
    .fill("2027-12-11T23:00");
  await page
    .getByLabel("Venue name (optional)", { exact: true })
    .fill("Royal Garden");
  await page
    .getByLabel("Map link (optional)", { exact: true })
    .fill("https://maps.google.com/?q=Udaipur");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/event-form-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/[a-f0-9]+$`));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sangeet Night", exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/event-detail-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "Edit event", exact: true }).click();
  await page
    .getByLabel("Event name *", { exact: true })
    .fill("Sangeet & Music");
  await page.getByRole("radio", { name: /Public/ }).check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sangeet & Music", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Back to schedule/ }).click();
  await expect(page).toHaveURL(base);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/event-list-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: /View details/ }).click();
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep event" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(base);
  await expect(page.getByText("Your celebrations start here.")).toBeVisible();
});
test("event API isolates weddings, validates partial dates, and deletes dependencies atomically", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/v1/auth/register", {
        headers,
        data: {
          displayName: "Event API",
          email: "events-api@example.com",
          password: "Event planner password 2027!",
        },
      })
    ).status(),
  ).toBe(201);
  const user = (await (await request.get("/api/v1/auth/me")).json()).data.user;
  const wid = (
    await (
      await request.post("/api/v1/weddings", {
        headers,
        data: { ...wedding, slug: "events-api" },
      })
    ).json()
  ).data.id;
  const other = (
    await (
      await request.post("/api/v1/weddings", {
        headers,
        data: { ...wedding, slug: "events-other" },
      })
    ).json()
  ).data.id;
  const base = `/api/v1/weddings/${wid}/events`;
  const data = {
    name: "Sangeet",
    type: "SANGEET",
    startsAt: "2027-12-11T13:30:00Z",
    endsAt: "2027-12-11T17:30:00Z",
    venue: { name: "Hall", address: "Delhi" },
  };
  const created = await request.post(base, { headers, data });
  expect(created.status()).toBe(201);
  const event = (await created.json()).data;
  expect(event.visibility).toBe("INVITED_ONLY");
  expect(event.createdBy).toBeUndefined();
  const path = `${base}/${event.id}`;
  for (const method of ["get", "patch", "delete"] as const)
    expect(
      (
        await request[method](`/api/v1/weddings/${other}/events/${event.id}`, {
          headers,
          ...(method === "patch" ? { data: { name: "bad" } } : {}),
        })
      ).status(),
    ).toBe(404);
  expect(
    (
      await request.patch(path, {
        headers,
        data: { startsAt: "2027-12-12T13:30:00Z" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch(path, {
        headers,
        data: { venue: { name: "New Hall" } },
      })
    ).status(),
  ).toBe(200);
  expect((await (await request.get(path)).json()).data.venue.address).toBe(
    "Delhi",
  );
  expect(
    (await request.patch(path, { headers, data: { endsAt: null } })).status(),
  ).toBe(200);
  expect(
    (
      await request.patch(path, { headers, data: { weddingId: other } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(base, {
        headers,
        data: { ...data, venue: { mapUrl: "javascript:alert(1)" } },
      })
    ).status(),
  ).toBe(400);
  expect((await request.get(`${base}?from=invalid`)).status()).toBe(400);
  expect(
    (
      await request.post(base, {
        headers: { Origin: "https://other.example" },
        data,
      })
    ).status(),
  ).toBe(403);
  const early = await request.post(base, {
    headers,
    data: {
      ...data,
      name: "Haldi",
      startsAt: "2027-12-10T06:30:00Z",
      endsAt: null,
    },
  });
  expect(early.status()).toBe(201);
  expect(
    (await (await request.get(base)).json()).data.map(
      (e: { name: string }) => e.name,
    ),
  ).toEqual(["Haldi", "Sangeet"]);
  expect(
    (await (await request.get(`${base}?from=2027-12-11T00:00:00Z`)).json())
      .data,
  ).toHaveLength(1);
  const uri = process.env.PMM_TEST_MONGODB_URI;
  if (!uri?.startsWith("mongodb://127.0.0.1:"))
    throw new Error("Disposable database required");
  const conn = await mongoose
    .createConnection(uri, { dbName: "pmm_auth_test" })
    .asPromise();
  const db = conn.db!;
  const filter = {
    weddingId: new mongoose.Types.ObjectId(wid),
    eventId: new mongoose.Types.ObjectId(event.id),
  };
  try {
    await db.collection("weddingMembers").updateOne(
      {
        weddingId: filter.weddingId,
        userId: new mongoose.Types.ObjectId(user.id),
      },
      { $set: { role: "MANAGER" } },
    );
    expect(
      (
        await request.patch(path, { headers, data: { dressCode: "Festive" } })
      ).status(),
    ).toBe(200);
    for (const collection of [
      "eventGuests",
      "tasks",
      "expenses",
      "photoUploadTokens",
      "photos",
    ])
      await db.collection(collection).insertOne({ ...filter });
    expect((await request.delete(path, { headers })).status()).toBe(409);
    expect(await db.collection("eventGuests").countDocuments(filter)).toBe(1);
    await db.collection("photos").deleteMany(filter);
    expect((await request.delete(path, { headers })).status()).toBe(204);
    expect((await request.get(path)).status()).toBe(404);
    expect(await db.collection("eventGuests").countDocuments(filter)).toBe(0);
    expect(
      (await db.collection("photoUploadTokens").findOne(filter))?.revokedAt,
    ).toBeTruthy();
    for (const collection of ["tasks", "expenses"]) {
      expect(await db.collection(collection).countDocuments(filter)).toBe(0);
      expect(
        await db
          .collection(collection)
          .countDocuments({ weddingId: filter.weddingId }),
      ).toBe(1);
    }
    await db.collection("weddingMembers").deleteOne({
      weddingId: filter.weddingId,
      userId: new mongoose.Types.ObjectId(user.id),
    });
    expect((await request.get(base)).status()).toBe(404);
    expect((await request.post(base, { headers, data })).status()).toBe(404);
  } finally {
    await conn.close();
  }
});
