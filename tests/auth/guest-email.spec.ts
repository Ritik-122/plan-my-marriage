import {
  expect,
  test,
  type BrowserContext,
  type APIRequestContext,
} from "@playwright/test";
import mongoose from "mongoose";
import { SignJWT } from "jose";
import { randomUUID, createHash } from "node:crypto";
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
async function setup(context: BrowserContext, name: string) {
  await account(context, name);
  const request = context.request;
  const created = await request.post("/api/v1/weddings", {
    headers,
    data: {
      brideName: "Priya",
      groomName: "Ritik",
      city: "Udaipur",
      weddingDate: "2027-12-12T06:30:00Z",
      slug: name,
      theme: "CLASSIC_INDIAN",
    },
  });
  expect(created.status()).toBe(201);
  const weddingId = (await created.json()).data.id;
  const base = `/api/v1/weddings/${weddingId}`;
  const events = [];
  for (const name of ["Sangeet celebration", "Private unassigned event"]) {
    const response = await request.post(`${base}/events`, {
      headers,
      data: {
        name,
        type: "CUSTOM",
        startsAt: "2027-12-11T13:30:00Z",
        visibility: "INVITED_ONLY",
        venue: { name: "The courtyard" },
      },
    });
    expect(response.status()).toBe(201);
    events.push((await response.json()).data);
  }
  return { request, weddingId, base, events };
}
async function guest(
  request: APIRequestContext,
  base: string,
  email: string,
  eventId?: string,
) {
  const response = await request.post(`${base}/guests`, {
    headers,
    data: { name: "Rajesh Sharma", email, notes: "PRIVATE ORGANIZER NOTE" },
  });
  expect(response.status()).toBe(201);
  const id = (await response.json()).data.id;
  if (eventId)
    expect(
      (
        await request.post(`${base}/events/${eventId}/guests`, {
          headers,
          data: { guestIds: [id] },
        })
      ).status(),
    ).toBe(200);
  return { id, path: `${base}/guests/${id}/invitations/email` };
}
async function preview(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}
const inputFor = (state: { preview: { previewHash: string } }) => ({
  requestId: randomUUID(),
  previewHash: state.preview.previewHash,
});
test("guest email preview, authorization, idempotency, failures and capability lifecycle", async ({
  context,
  browser,
}) => {
  const { request, weddingId, base, events } = await setup(
    context,
    "guest-email-security",
  );
  const current = await guest(
    request,
    base,
    "email-guest@example.com",
    events[0].id,
  );
  const tokens = mongoose.connection.db!.collection("guestAccessTokens");
  const outbox = mongoose.connection.db!.collection("testMailOutbox");
  const state = await preview(request, current.path);
  expect(state.preview.events).toHaveLength(1);
  expect(JSON.stringify(state)).not.toContain("PRIVATE ORGANIZER NOTE");
  expect(
    await tokens.countDocuments({
      guestId: new mongoose.Types.ObjectId(current.id),
    }),
  ).toBe(0);
  const input = inputFor(state);
  expect(
    (
      await request.post(current.path, {
        headers: { Origin: "https://evil.example" },
        data: input,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(current.path, {
        headers,
        data: { ...input, email: "forged@example.com" },
      })
    ).status(),
  ).toBe(400);
  const outside = await browser.newContext({ baseURL: origin });
  try {
    expect((await outside.request.get(current.path)).status()).toBe(401);
    await account(outside, "guest-email-outsider");
    expect((await outside.request.get(current.path)).status()).toBe(404);
    expect(
      (
        await outside.request.post(current.path, { headers, data: input })
      ).status(),
    ).toBe(404);
  } finally {
    await outside.close();
  }
  const sent = await request.post(current.path, { headers, data: input });
  expect(sent.status()).toBe(202);
  expect((await sent.json()).data.sent).toBe(true);
  expect(
    (await request.post(current.path, { headers, data: input })).status(),
  ).toBe(202);
  expect(await outbox.countDocuments({ to: "email-guest@example.com" })).toBe(
    1,
  );
  const mail = await outbox.findOne({ to: "email-guest@example.com" });
  expect(mail!.text).toContain("Sangeet celebration");
  expect(mail!.text).not.toContain("Private unassigned");
  expect(mail!.html).not.toContain("PRIVATE ORGANIZER NOTE");
  const rawToken = /guest\/invite\/([A-Za-z0-9_-]{43})/.exec(mail!.text)![1];
  const record = await tokens.findOne({
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
  });
  expect(record!.emailStatus).toBe("SENT");
  expect(record!.sentAt).toBeTruthy();
  expect(record!.providerMessageId).toBeTruthy();
  expect(JSON.stringify(record)).not.toContain(rawToken);
  const metadata = await preview(request, current.path);
  expect(JSON.stringify(metadata)).not.toContain(rawToken);
  expect(JSON.stringify(metadata)).not.toContain("tokenHash");
  expect(JSON.stringify(metadata)).not.toContain("providerMessageId");
  expect(
    (
      await request.get("/api/v1/guest/invitation", {
        headers: { Authorization: `Bearer ${rawToken}` },
      })
    ).status(),
  ).toBe(200);
  const stale = inputFor(metadata);
  expect(
    (
      await request.patch(`${base}/guests/${current.id}`, {
        headers,
        data: { email: "updated-guest@example.com" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await request.post(current.path, { headers, data: stale })).status(),
  ).toBe(409);
  for (const email of [
    "",
    "failure-guest@example.com",
    "timeout-guest@example.com",
  ]) {
    const target = await guest(request, base, email);
    const response = await request.post(target.path, {
      headers,
      data: inputFor(await preview(request, target.path)),
    });
    expect(response.status()).toBe(email ? 502 : 400);
    expect(await response.text()).not.toContain("PRIVATE PROVIDER ERROR");
    const records = await tokens
      .find({ guestId: new mongoose.Types.ObjectId(target.id) })
      .toArray();
    if (!email) expect(records).toHaveLength(0);
    else {
      expect(records).toHaveLength(1);
      expect(records[0].sentAt).toBeNull();
      expect(records[0].revokedAt).toBeTruthy();
      expect(records[0].emailStatus).toBe("FAILED");
    }
  }
  const race = await guest(request, base, "slow-race@example.com");
  const raceInput = inputFor(await preview(request, race.path));
  const responses = await Promise.all([
    request.post(race.path, { headers, data: raceInput }),
    request.post(race.path, { headers, data: raceInput }),
  ]);
  expect(responses.some((r) => r.status() === 202)).toBe(true);
  expect(responses.every((r) => [202, 409].includes(r.status()))).toBe(true);
  expect(await outbox.countDocuments({ to: "slow-race@example.com" })).toBe(1);
  const deleted = await guest(request, base, "slow-deleted@example.com");
  const deleteInput = inputFor(await preview(request, deleted.path));
  const pending = request.post(deleted.path, { headers, data: deleteInput });
  await expect
    .poll(() =>
      tokens.countDocuments({
        guestId: new mongoose.Types.ObjectId(deleted.id),
        emailStatus: "SENDING",
      }),
    )
    .toBe(1);
  expect(
    (
      await request.delete(`${base}/guests/${deleted.id}`, { headers })
    ).status(),
  ).toBe(204);
  expect((await pending).status()).toBe(409);
  const deletedRecord = await tokens.findOne({
    guestId: new mongoose.Types.ObjectId(deleted.id),
  });
  expect(deletedRecord!.revokedAt).toBeTruthy();
  expect(deletedRecord!.emailStatus).toBe("FAILED");
  const managerContext = await browser.newContext({ baseURL: origin });
  try {
    const managerId = await account(managerContext, "guest-email-manager");
    await mongoose.connection.db!.collection("weddingMembers").insertOne({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      userId: managerId,
      role: "MANAGER",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const updated = await preview(managerContext.request, current.path);
    expect(
      (
        await managerContext.request.post(current.path, {
          headers,
          data: inputFor(updated),
        })
      ).status(),
    ).toBe(202);
  } finally {
    await managerContext.close();
  }
  // Explicit resends create fresh capabilities without silently revoking already shared links.
  expect(
    (
      await request.get("/api/v1/guest/invitation", {
        headers: { Authorization: `Bearer ${rawToken}` },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.delete(
        `${base}/guests/${current.id}/access-links/${record!._id}`,
        { headers },
      )
    ).status(),
  ).toBe(204);
  expect(
    (
      await request.get("/api/v1/guest/invitation", {
        headers: { Authorization: `Bearer ${rawToken}` },
      })
    ).status(),
  ).toBe(401);
});
test("Stitch email modal previews, sends, recovers failures and fits mobile", async ({
  context,
  page,
}, testInfo) => {
  const { request, weddingId, base, events } = await setup(
    context,
    "guest-email-ui",
  );
  const current = await guest(
    request,
    base,
    "ui-guest-email@example.com",
    events[0].id,
  );
  await page.goto(`/app/weddings/${weddingId}/guests/${current.id}`);
  await expect(
    page.getByRole("heading", { name: "Email invitation", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Preview & send invitation", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Preview invitation email" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Sangeet celebration");
  await expect(dialog).not.toContainText("Private unassigned");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`guest-email-preview-${width}.png`),
    });
  }
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    await mongoose.connection
      .db!.collection("testMailOutbox")
      .countDocuments({ to: "ui-guest-email@example.com" }),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Preview & send invitation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send invitation email", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Resend accepted");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("Sent to email provider", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`guest-email-details-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: "Preview & resend invitation", exact: true })
    .click();
  let loseResponse = true;
  await page.route("**/invitations/email", async (route) => {
    if (route.request().method() === "POST" && loseResponse) {
      loseResponse = false;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Resend invitation email", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "could not be confirmed",
  );
  await page
    .getByRole("button", { name: "Retry same attempt", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Resend accepted");
  await page.unroute("**/invitations/email");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  expect(
    await mongoose.connection
      .db!.collection("testMailOutbox")
      .countDocuments({ to: "ui-guest-email@example.com" }),
  ).toBe(2);
  const fail = await guest(request, base, "failure-ui@example.com");
  await page.goto(`/app/weddings/${weddingId}/guests/${fail.id}`);
  await page
    .getByRole("button", { name: "Preview & send invitation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send invitation email", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Resend refused",
  );
  await expect(
    page.getByRole("button", { name: "Reload preview", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("guest-email-failure.png"),
  });
  await request.patch(`${base}/guests/${fail.id}`, {
    headers,
    data: { email: "recovered-ui@example.com" },
  });
  await page
    .getByRole("button", { name: "Reload preview", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "recovered-ui@example.com",
  );
  await page
    .getByRole("button", { name: "Send invitation email", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Resend accepted");
});
