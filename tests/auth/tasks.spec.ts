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
  const name = `tasks-${randomUUID().slice(0, 8)}`;
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
test("task API preserves workflow, enforces tenancy, and handles references", async ({
  context,
  browser,
}) => {
  const { userId, weddingId, base, eventId } = await setup(context);
  const request = context.request;
  const url = `${base}/tasks`;
  const other = await browser.newContext({ baseURL: origin });
  const foreign = await setup(other);
  const create = (data: object) => request.post(url, { headers, data });
  expect(
    (
      await create({ title: "Invalid event", eventId: foreign.eventId })
    ).status(),
  ).toBe(400);
  expect(
    (
      await create({
        title: "Invalid assignee",
        assignedToUserId: foreign.userId,
      })
    ).status(),
  ).toBe(400);
  expect((await create({ title: "Invalid", createdBy: userId })).status()).toBe(
    400,
  );
  expect(
    (
      await request.post(url, {
        headers: { Origin: "https://wrong.example" },
        data: { title: "No" },
      })
    ).status(),
  ).toBe(403);
  const response = await create({
    title: "Confirm DJ [live]",
    description: "Bring sound equipment",
    status: "IN_PROGRESS",
    priority: "HIGH",
    eventId,
    assignedToUserId: userId,
    dueDate: "2020-01-01T18:30:00Z",
  });
  expect(response.status()).toBe(201);
  const task = (await response.json()).data;
  const detail = `${url}/${task.id}`;
  expect((await other.request.get(detail)).status()).toBe(404);
  expect(
    (
      await other.request.patch(detail, {
        headers,
        data: { status: "COMPLETED" },
      })
    ).status(),
  ).toBe(404);
  const patch = (data: object) => request.patch(detail, { headers, data });
  expect((await patch({ title: "Confirm DJ [live] updated" })).status()).toBe(
    200,
  );
  let saved = (await (await request.get(detail)).json()).data;
  expect(saved.status).toBe("IN_PROGRESS");
  expect(saved.priority).toBe("HIGH");
  expect(saved.description).toBe("Bring sound equipment");
  expect(
    (await (await request.get(`${url}?q=%5Blive%5D&overdue=true`)).json()).data,
  ).toHaveLength(1);
  const completed = (await (await patch({ status: "COMPLETED" })).json()).data;
  expect(completed.completedAt).toBeTruthy();
  expect(
    (await (await patch({ status: "COMPLETED" })).json()).data.completedAt,
  ).toBe(completed.completedAt);
  expect(
    (await (await request.get(`${url}?overdue=true`)).json()).data,
  ).toHaveLength(0);
  expect(
    (
      await (
        await patch({ status: "TODO", dueDate: null, assignedToUserId: null })
      ).json()
    ).data.completedAt,
  ).toBeNull();
  await create({ title: "Second task" });
  await create({ title: "Third task" });
  const firstPage = await (await request.get(`${url}?limit=2`)).json();
  expect(firstPage.data).toHaveLength(2);
  expect(firstPage.meta.nextCursor).toBeTruthy();
  const secondPage = await (
    await request.get(`${url}?limit=2&cursor=${firstPage.meta.nextCursor}`)
  ).json();
  expect(secondPage.data).toHaveLength(1);
  expect(
    firstPage.data.some((t: { id: string }) => t.id === secondPage.data[0].id),
  ).toBe(false);
  expect((await request.get(`${url}?limit=101`)).status()).toBe(400);
  expect((await request.get(`${url}/bad-id`)).status()).toBe(404);
  const manager = await browser.newContext({ baseURL: origin });
  const managerId = await account(manager, `manager-${randomUUID()}`);
  const db = mongoose.connection.db!;
  await db.collection("weddingMembers").insertOne({
    weddingId: new mongoose.Types.ObjectId(weddingId),
    userId: managerId,
    role: "MANAGER",
    joinedAt: new Date(),
  });
  expect(
    (
      await manager.request.patch(detail, {
        headers,
        data: { assignedToUserId: managerId.toString(), status: "IN_PROGRESS" },
      })
    ).status(),
  ).toBe(200);
  const options = (await (await request.get(`${url}/context`)).json()).data;
  expect(
    options.options.members.some(
      (m: { userId: string }) => m.userId === managerId.toString(),
    ),
  ).toBe(true);
  expect(options.summary.total).toBe(3);
  const member = await db.collection("weddingMembers").findOne({
    weddingId: new mongoose.Types.ObjectId(weddingId),
    userId: managerId,
  });
  expect(
    (
      await request.delete(`${base}/members/${member!._id}`, { headers })
    ).status(),
  ).toBe(204);
  expect((await manager.request.get(url)).status()).toBe(404);
  expect(
    (await patch({ assignedToUserId: managerId.toString() })).status(),
  ).toBe(400);
  expect(
    (await patch({ title: "Historical assignee retained" })).status(),
  ).toBe(200);
  expect(
    (await request.delete(`${base}/events/${eventId}`, { headers })).status(),
  ).toBe(204);
  saved = (await (await request.get(detail)).json()).data;
  expect(saved.eventId).toBeNull();
  expect(saved.assignedToUserId).toBe(managerId.toString());
  expect((await request.delete(detail, { headers })).status()).toBe(204);
  expect((await request.get(detail)).status()).toBe(404);
  await other.close();
  await manager.close();
});
test("Stitch task screens create, filter, edit, reopen and delete on desktop and mobile", async ({
  context,
  page,
}, testInfo) => {
  const { weddingId } = await setup(context);
  const path = `/app/weddings/${weddingId}/tasks`;
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Wedding Tasks" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "+ Add task" }).click();
  const dialog = page.getByRole("dialog", { name: "Add task", exact: true });
  await dialog.getByLabel("Task title").fill("Confirm Sangeet DJ");
  await dialog.getByLabel("Description").fill("Confirm timing and equipment.");
  await dialog.getByLabel("Related event").selectOption({ label: "Sangeet" });
  await dialog.getByLabel("Due date").fill("2020-01-01T19:00");
  await dialog.getByLabel("Priority").selectOption("HIGH");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`task-editor-${width}.png`),
      fullPage: true,
    });
  }
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Confirm Sangeet DJ", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Overdue only").check();
  await expect(
    page.getByRole("link", { name: "Confirm Sangeet DJ", exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`tasks-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("link", { name: "Confirm Sangeet DJ", exact: true })
    .click();
  await page.getByRole("button", { name: "Mark as done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reopen task", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Reopen task", exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`task-details-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Reopen task", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mark as done", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit task", exact: true });
  await edit.getByLabel("Task title").fill("Confirm updated DJ");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirm updated DJ" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Confirm updated DJ" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page).toHaveURL(path);
  await expect(
    page.getByText("A little planning, a lot more together"),
  ).toBeVisible();
});
