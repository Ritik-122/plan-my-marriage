import { expect, test, type APIRequestContext } from "@playwright/test";
import mongoose from "mongoose";
const headers = { Origin: "http://127.0.0.1:3111" };
const account = {
  displayName: "Guest Planner",
  email: "guest-suite@example.com",
  password: "Guest planner test password 2027!",
};
test.beforeAll(async ({ request }) => {
  expect(
    (
      await request.post("/api/v1/auth/register", { headers, data: account })
    ).status(),
  ).toBe(201);
});
async function setup(request: APIRequestContext, slug: string) {
  expect(
    (
      await request.post("/api/v1/auth/login", {
        headers,
        data: { email: account.email, password: account.password },
      })
    ).status(),
  ).toBe(200);
  const response = await request.post("/api/v1/weddings", {
    headers,
    data: {
      brideName: "Priya",
      groomName: "Ritik",
      city: "Udaipur",
      weddingDate: "2027-12-12T06:30:00Z",
      slug,
      theme: "CLASSIC_INDIAN",
    },
  });
  expect(response.status()).toBe(201);
  const wedding = (await response.json()).data;
  const events = [];
  for (const name of ["Mehendi", "Sangeet"]) {
    const res = await request.post(`/api/v1/weddings/${wedding.id}/events`, {
      headers,
      data: { name, type: "CUSTOM", startsAt: "2027-12-11T13:30:00Z" },
    });
    expect(res.status()).toBe(201);
    events.push((await res.json()).data);
  }
  return { wedding, events };
}
test("guest screens save contacts and assignments, recover partial saves, filter and remove", async ({
  page,
  context,
}) => {
  const { wedding, events } = await setup(context.request, "guests-ui");
  const base = `/app/weddings/${wedding.id}/guests`;
  await page.goto(base);
  await expect(
    page.getByText("Every celebration starts with your people."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add your first guest" }).click();
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Check",
  );
  await page.getByLabel("Full name *", { exact: true }).fill("Rajesh Sharma");
  await page
    .getByLabel("Email address (optional)", { exact: true })
    .fill(" RAJESH@EXAMPLE.COM ");
  await page
    .getByLabel("Phone number (optional)", { exact: true })
    .fill("+91 98765 43210");
  await page
    .getByLabel("Private planning notes")
    .fill("Arriving with family on Friday.");
  await page.getByRole("button", { name: "Select all events" }).click();
  await expect(page.getByRole("main").getByRole("alert")).not.toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/guest-form-${width}.png`,
      fullPage: true,
    });
  }
  let fail = true;
  await page.route(`**/events/${events[1].id}/guests`, async (route) => {
    if (fail && route.request().method() === "POST") {
      fail = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Temporary test failure" } }),
      });
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Guest details are saved",
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/[a-f0-9]+$`));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Rajesh Sharma", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("2 celebrations assigned", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await (
        await context.request.get(`/api/v1/weddings/${wedding.id}/guests`)
      ).json()
    ).data,
  ).toHaveLength(1);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/guest-detail-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "Edit details", exact: true }).click();
  await page.getByRole("checkbox", { name: /Sangeet/ }).uncheck();
  await page
    .getByLabel("Full name *", { exact: true })
    .fill("Rajesh Kumar Sharma");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("1 celebration assigned", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Back to guests/ }).click();
  await expect(page).toHaveURL(base);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/guest-list-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByLabel("Search guests", { exact: true }).fill("nobody");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No guests match these filters.")).toBeVisible();
  await page.getByRole("link", { name: "Reset", exact: true }).click();
  await page.getByLabel("Event", { exact: true }).selectOption(events[1].id);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No guests match these filters.")).toBeVisible();
  await page.getByRole("link", { name: "Reset", exact: true }).click();
  await page.getByRole("link", { name: "View", exact: true }).click();
  await page.getByRole("button", { name: "Remove guest", exact: true }).click();
  await page.getByRole("button", { name: "Keep guest" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Remove guest", exact: true }).click();
  await page.getByRole("button", { name: "Remove permanently" }).click();
  await expect(page).toHaveURL(base);
  await expect(
    page.getByText("Every celebration starts with your people."),
  ).toBeVisible();
});
test("guest API scopes tenants, paginates, preserves RSVP and cleans up assignments and tokens", async ({
  request,
  playwright,
}) => {
  const { wedding, events } = await setup(request, "guests-api");
  const { wedding: other, events: otherEvents } = await setup(
    request,
    "guests-foreign",
  );
  const base = `/api/v1/weddings/${wedding.id}/guests`;
  const create = async (url: string, name: string) => {
    const r = await request.post(url, {
      headers,
      data: {
        name,
        email: " TEST@EXAMPLE.COM ",
        phone: "+91 98765 43210",
        notes: "Private",
      },
    });
    expect(r.status()).toBe(201);
    return (await r.json()).data;
  };
  const guest = await create(base, "Raj [Test]");
  const second = await create(base, "Raj [Test]");
  const foreign = await create(
    `/api/v1/weddings/${other.id}/guests`,
    "Foreign",
  );
  expect(guest.email).toBe("test@example.com");
  expect(guest.phone).toBe("+919876543210");
  expect(guest.createdBy).toBeUndefined();
  const path = `${base}/${guest.id}`;
  const assignment = `/api/v1/weddings/${wedding.id}/events/${events[0].id}/guests`;
  for (const method of ["get", "patch", "delete"] as const)
    expect(
      (
        await request[method](
          `/api/v1/weddings/${other.id}/guests/${guest.id}`,
          { headers, ...(method === "patch" ? { data: { name: "Bad" } } : {}) },
        )
      ).status(),
    ).toBe(404);
  const anon = await playwright.request.newContext({ baseURL: headers.Origin });
  expect((await anon.get(base)).status()).toBe(401);
  await anon.dispose();
  expect(
    (
      await request.post(assignment, {
        headers,
        data: { guestIds: [guest.id, foreign.id] },
      })
    ).status(),
  ).toBe(404);
  expect(
    (await (await request.get(`${path}/events`)).json()).data,
  ).toHaveLength(0);
  expect(
    (
      await request.post(
        `/api/v1/weddings/${wedding.id}/events/${otherEvents[0].id}/guests`,
        { headers, data: { guestIds: [guest.id] } },
      )
    ).status(),
  ).toBe(404);
  const race = await Promise.all([
    request.post(assignment, { headers, data: { guestIds: [guest.id] } }),
    request.post(assignment, { headers, data: { guestIds: [guest.id] } }),
  ]);
  for (const r of race) expect(r.status()).toBe(200);
  const pages = await (await request.get(`${base}?limit=1`)).json();
  expect(pages.data).toHaveLength(1);
  expect(pages.meta.nextCursor).toBeTruthy();
  const next = await (
    await request.get(`${base}?limit=1&cursor=${pages.meta.nextCursor}`)
  ).json();
  expect(next.data).toHaveLength(1);
  expect(next.data[0].id).not.toBe(pages.data[0].id);
  expect(next.meta.nextCursor).toBeNull();
  expect(
    (
      await (
        await request.get(`${base}?q=${encodeURIComponent("[Test]")}`)
      ).json()
    ).data,
  ).toHaveLength(2);
  expect(
    (await (await request.get(`${base}?q=${encodeURIComponent(".*")}`)).json())
      .data,
  ).toHaveLength(0);
  expect((await request.get(`${base}?cursor=bad`)).status()).toBe(400);
  expect((await request.get(`${base}?limit=101`)).status()).toBe(400);
  expect(
    (
      await request.patch(path, { headers, data: { rsvpStatus: "ATTENDING" } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(base, {
        headers,
        data: { name: "Bad", guestGroupId: foreign.id },
      })
    ).status(),
  ).toBe(404);
  expect(
    (await request.patch(path, { headers, data: { notes: "" } })).status(),
  ).toBe(200);
  expect((await (await request.get(path)).json()).data.email).toBe(
    "test@example.com",
  );
  const uri = process.env.PMM_TEST_MONGODB_URI;
  if (!uri?.startsWith("mongodb://127.0.0.1:"))
    throw new Error("Disposable database required");
  const conn = await mongoose
    .createConnection(uri, { dbName: "pmm_auth_test" })
    .asPromise();
  const db = conn.db!;
  const filter = {
    weddingId: new mongoose.Types.ObjectId(wedding.id),
    guestId: new mongoose.Types.ObjectId(guest.id),
    eventId: new mongoose.Types.ObjectId(events[0].id),
  };
  try {
    expect(await db.collection("eventGuests").countDocuments(filter)).toBe(1);
    await db.collection("eventGuests").updateOne(filter, {
      $set: { rsvpStatus: "ATTENDING", respondedAt: new Date() },
    });
    expect(
      (
        await request.post(assignment, {
          headers,
          data: { guestIds: [guest.id] },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await db.collection("eventGuests").findOne(filter))?.rsvpStatus,
    ).toBe("ATTENDING");
    expect(
      (
        await (
          await request.get(
            `${base}?eventId=${events[0].id}&rsvpStatus=ATTENDING`,
          )
        ).json()
      ).data,
    ).toHaveLength(1);
    const user = (await (await request.get("/api/v1/auth/me")).json()).data
      .user;
    await db.collection("weddingMembers").updateOne(
      {
        weddingId: filter.weddingId,
        userId: new mongoose.Types.ObjectId(user.id),
      },
      { $set: { role: "MANAGER" } },
    );
    expect(
      (
        await request.patch(path, { headers, data: { name: "Manager edit" } })
      ).status(),
    ).toBe(200);
    await db.collection("guestAccessTokens").insertOne({
      weddingId: filter.weddingId,
      guestId: filter.guestId,
      tokenHash: "synthetic-disposable-test-token",
    });
    expect((await request.delete(path, { headers })).status()).toBe(204);
    expect(await db.collection("eventGuests").countDocuments(filter)).toBe(0);
    expect(
      (
        await db
          .collection("guestAccessTokens")
          .findOne({ guestId: filter.guestId })
      )?.revokedAt,
    ).toBeTruthy();
    const secondPath = `${base}/${second.id}`;
    await Promise.all([
      request.post(assignment, { headers, data: { guestIds: [second.id] } }),
      request.delete(secondPath, { headers }),
    ]);
    expect(
      await db.collection("eventGuests").countDocuments({
        weddingId: filter.weddingId,
        guestId: new mongoose.Types.ObjectId(second.id),
      }),
    ).toBe(0);
    await db.collection("weddingMembers").deleteOne({
      weddingId: filter.weddingId,
      userId: new mongoose.Types.ObjectId(user.id),
    });
    expect((await request.get(base)).status()).toBe(404);
    expect(
      (
        await request.post(base, { headers, data: { name: "Denied" } })
      ).status(),
    ).toBe(404);
  } finally {
    await conn.close();
  }
});
