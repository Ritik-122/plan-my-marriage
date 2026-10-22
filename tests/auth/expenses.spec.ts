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
async function account(context: BrowserContext, name: string) {
  const _id = new mongoose.Types.ObjectId();
  await mongoose.connection.db!.collection("users").insertOne({
    _id,
    email: `${name}@example.com`,
    displayName: name,
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
  const name = `expenses-${randomUUID().slice(0, 8)}`;
  const userId = await account(context, name);
  const response = await context.request.post("/api/v1/weddings", {
    headers,
    data: {
      brideName: "Priya",
      groomName: "Ritik",
      city: "Jaipur",
      weddingDate: "2027-12-12T06:30:00Z",
      slug: name,
      theme: "CLASSIC_INDIAN",
    },
  });
  expect(response.status()).toBe(201);
  const weddingId = (await response.json()).data.id;
  const base = `/api/v1/weddings/${weddingId}`;
  const eventResponse = await context.request.post(`${base}/events`, {
    headers,
    data: {
      name: "Sangeet",
      type: "CUSTOM",
      startsAt: "2027-12-11T13:30:00Z",
      visibility: "INVITED_ONLY",
    },
  });
  expect(eventResponse.status()).toBe(201);
  return {
    userId: userId.toString(),
    weddingId,
    base,
    eventId: (await eventResponse.json()).data.id,
  };
}
test("expenses preserve paise precision, tenancy, summaries and event cleanup", async ({
  context,
  browser,
}) => {
  const { userId, weddingId, base, eventId } = await setup(context);
  const request = context.request;
  const url = `${base}/expenses`;
  const create = (data: object) =>
    request.post(url, {
      headers,
      data: {
        name: "Photographer",
        category: "PHOTOGRAPHY",
        amount: 80000.5,
        date: "2027-02-01T00:00:00+05:30",
        ...data,
      },
    });
  const other = await browser.newContext({ baseURL: origin });
  const foreign = await setup(other);
  for (const data of [
    { amount: 1.001 },
    { amount: -1 },
    { amountPaise: 50 },
    { budget: 100 },
    { eventId: foreign.eventId },
    { createdBy: foreign.userId },
  ])
    expect((await create(data)).status()).toBe(400);
  expect(
    (
      await request.post(url, {
        headers: { Origin: "https://wrong.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const created = await create({
    eventId,
    name: "Photos [main]",
    vendorName: "ABC",
    paidBy: "Family",
    notes: "Receipt reference",
  });
  expect(created.status()).toBe(201);
  const row = (await created.json()).data;
  expect(row.amountPaise).toBe(8000050);
  expect(row.currency).toBe("INR");
  expect(row).not.toHaveProperty("__v");
  const detail = `${url}/${row.id}`;
  for (const suffix of [
    "/expenses",
    `/expenses/${row.id}`,
    "/expenses/summary",
    "/dashboard",
  ])
    expect((await other.request.get(`${base}${suffix}`)).status()).toBe(404);
  expect(
    (
      await other.request.patch(detail, { headers, data: { amount: 1 } })
    ).status(),
  ).toBe(404);
  expect((await other.request.delete(detail, { headers })).status()).toBe(404);
  const updated = await request.patch(detail, {
    headers,
    data: { name: "Photos [main] updated" },
  });
  expect(updated.status()).toBe(200);
  expect((await updated.json()).data).toMatchObject({
    amountPaise: 8000050,
    category: "PHOTOGRAPHY",
    vendorName: "ABC",
    notes: "Receipt reference",
  });
  await create({ name: "Travel", category: "TRAVEL", amount: 0.29 });
  await create({ name: "Zero", category: "OTHER", amount: 0 });
  const summary = (await (await request.get(`${url}/summary`)).json()).data;
  expect(summary).toMatchObject({
    totalAmountPaise: 8000079,
    currency: "INR",
    count: 3,
  });
  expect(
    summary.byCategory.find(
      (r: { category: string }) => r.category === "PHOTOGRAPHY",
    ).amountPaise,
  ).toBe(8000050);
  expect(
    summary.byEvent.find((r: { eventId: string }) => r.eventId === eventId)
      .amountPaise,
  ).toBe(8000050);
  expect(
    (await (await request.get(`${url}?eventId=general`)).json()).data,
  ).toHaveLength(2);
  expect(
    (await (await request.get(`${url}?q=%5Bmain%5D`)).json()).data,
  ).toHaveLength(1);
  expect(
    (await (await request.get(`${url}?category=TRAVEL`)).json()).data,
  ).toHaveLength(1);
  const exact = new URLSearchParams({
    dateFrom: row.expenseDate,
    dateTo: row.expenseDate,
  });
  expect(
    (await (await request.get(`${url}?${exact}`)).json()).data,
  ).toHaveLength(3);
  const page1 = await (await request.get(`${url}?limit=2`)).json();
  const page2 = await (
    await request.get(`${url}?limit=2&cursor=${page1.meta.nextCursor}`)
  ).json();
  expect(page1.data).toHaveLength(2);
  expect(page2.data).toHaveLength(1);
  expect(
    new Set([...page1.data, ...page2.data].map((r: { id: string }) => r.id))
      .size,
  ).toBe(3);
  expect((await request.get(`${url}?cursor=garbage`)).status()).toBe(400);
  expect(
    (
      await request.get(
        `${url}?dateFrom=2027-03-01T00:00:00Z&dateTo=2027-02-01T00:00:00Z`,
      )
    ).status(),
  ).toBe(400);
  const stored = await mongoose.connection
    .db!.collection("expenses")
    .findOne({ _id: new mongoose.Types.ObjectId(row.id) });
  expect(stored?.amountPaise).toBe(8000050);
  expect(stored).not.toHaveProperty("amount");
  const manager = await browser.newContext({ baseURL: origin });
  const managerId = await account(manager, `manager-${randomUUID()}`);
  const membership = await mongoose.connection
    .db!.collection("weddingMembers")
    .insertOne({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      userId: managerId,
      role: "MANAGER",
      joinedAt: new Date(),
    });
  expect(
    (
      await manager.request.patch(detail, { headers, data: { amount: 1.01 } })
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
      await manager.request.patch(detail, { headers, data: { amount: 20 } })
    ).status(),
  ).toBe(404);
  const before = (await (await request.get(`${base}/dashboard`)).json()).data;
  expect(before.expenses.totalAmountPaise).toBe(130);
  expect(before.guests.total).toBe(0);
  expect(before.eventCount).toBe(1);
  expect(before.tasks.total).toBe(0);
  // RSVP counts are per event assignment, independent of the number of people.
  const guestId = new mongoose.Types.ObjectId();
  const db = mongoose.connection.db!;
  await db.collection("guests").insertOne({
    _id: guestId,
    weddingId: new mongoose.Types.ObjectId(weddingId),
    name: "One guest",
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  await db.collection("eventGuests").insertMany(
    ["ATTENDING", "PENDING"].map((rsvpStatus, i) => ({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      guestId,
      eventId: i
        ? new mongoose.Types.ObjectId()
        : new mongoose.Types.ObjectId(eventId),
      rsvpStatus,
    })),
  );
  const dashboard = (await (await request.get(`${base}/dashboard`)).json())
    .data;
  expect(dashboard.guests.total).toBe(1);
  expect(dashboard.eventRsvps).toEqual({
    attending: 1,
    pending: 1,
    notAttending: 0,
  });
  expect(
    (await request.delete(`${base}/events/${eventId}`, { headers })).status(),
  ).toBe(204);
  expect((await (await request.get(detail)).json()).data.eventId).toBeNull();
  expect(
    (await (await request.get(`${url}/summary`)).json()).data.totalAmountPaise,
  ).toBe(130);
  expect((await request.delete(detail, { headers })).status()).toBe(204);
  expect((await request.get(detail)).status()).toBe(404);
  expect(
    (await (await request.get(`${url}/summary`)).json()).data.totalAmountPaise,
  ).toBe(29);
  await other.close();
  await manager.close();
});
test("Stitch expense screens save, recover, filter and delete; dashboard routes correctly", async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const { weddingId, base } = await setup(context);
  const path = `/app/weddings/${weddingId}`;
  await page.goto("/app");
  await expect(page).toHaveURL(path);
  await expect(
    page
      .getByRole("navigation", { name: "Wedding navigation" })
      .getByRole("link", { name: "Dashboard", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Your weddings", exact: true }).click();
  await expect(page).toHaveURL(/\/app\?select=1$/);
  await page.getByRole("link", { name: /Open wedding/ }).click();
  await expect(page).toHaveURL(path);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Expenses", exact: true })
    .click();
  await page.getByRole("button", { name: "+ Add expense" }).click();
  const dialog = page.getByRole("dialog", { name: "Add expense", exact: true });
  await dialog.getByLabel("Expense name").fill("Wedding Photographer");
  await dialog
    .getByRole("combobox", { name: /^Category/ })
    .selectOption("PHOTOGRAPHY");
  await dialog.getByLabel("Amount (INR)").fill("80000.50");
  await dialog.getByLabel("Expense date").fill("2027-02-01");
  await dialog.getByLabel("Related event").selectOption({ label: "Sangeet" });
  await dialog.getByLabel("Vendor name").fill("ABC Photography");
  await dialog.getByLabel("Paid by").fill("Ritik");
  await dialog.getByLabel("Notes").fill("Ceremony photography package");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`expense-editor-${width}.png`),
      fullPage: true,
    });
  }
  await page.route(`**${base}/expenses`, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "Temporary expense failure" },
          }),
        })
      : route.continue(),
  );
  await dialog.getByRole("button", { name: "Create expense" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Temporary expense failure",
  );
  await expect(dialog.getByLabel("Amount (INR)")).toHaveValue("80000.50");
  await page.unroute(`**${base}/expenses`);
  await dialog.getByRole("button", { name: "Create expense" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Wedding Photographer", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Search expenses").fill("not found");
  await expect(page.getByText("No expenses match these filters")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(
    page.getByRole("link", { name: "Wedding Photographer", exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`expenses-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("link", { name: "Wedding Photographer", exact: true })
    .click();
  await expect(
    page.getByText("ABC Photography", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`expense-details-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Edit expense", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit expense", exact: true });
  await edit.getByLabel("Amount (INR)").fill("1.01");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(edit).not.toBeVisible();
  await expect(page.getByText("₹1.01", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Recorded expenses/ }),
  ).toContainText("₹1.01");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`dashboard-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Expenses", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Wedding Photographer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete expense", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Wedding Photographer", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete expense", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page).toHaveURL(`${path}/expenses`);
  await expect(page.getByText("Your spending story starts here")).toBeVisible();
  const second = await context.request.post("/api/v1/weddings", {
    headers,
    data: {
      brideName: "Other",
      groomName: "Wedding",
      city: "Delhi",
      weddingDate: "2027-12-12T06:30:00Z",
      slug: `second-${randomUUID().slice(0, 8)}`,
      theme: "CLASSIC_INDIAN",
    },
  });
  expect(second.status()).toBe(201);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("link", { name: /Open wedding/ })).toHaveCount(2);
});
