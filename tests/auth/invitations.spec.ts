import { expect, test, type APIRequestContext } from "@playwright/test";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { createHash } from "node:crypto";
const headers = { Origin: "http://127.0.0.1:3111" };
const account = {
  email: "invitation-planner@example.com",
  password: "Invitation test password 2027!",
};
test.beforeAll(async () => {
  const uri = process.env.PMM_TEST_MONGODB_URI;
  if (!uri?.startsWith("mongodb://127.0.0.1:"))
    throw new Error("Disposable test database required.");
  await mongoose.connect(uri, { dbName: "pmm_auth_test" });
  await mongoose.connection.db!.collection("users").updateOne(
    { email: account.email },
    {
      $setOnInsert: {
        displayName: "Invitation Planner",
        email: account.email,
        passwordHash: await hash(account.password, 12),
        sessionVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
});
test.afterAll(async () => {
  await mongoose.disconnect();
});
async function setup(request: APIRequestContext, slug: string) {
  expect(
    (
      await request.post("/api/v1/auth/login", { headers, data: account })
    ).status(),
  ).toBe(200);
  const weddingResponse = await request.post("/api/v1/weddings", {
    headers,
    data: {
      brideName: "Priya",
      groomName: "Ritik",
      city: "Udaipur",
      weddingDate: "2027-12-12T06:30:00Z",
      slug,
      theme: "CLASSIC_INDIAN",
      description: "Join us for our celebrations.",
    },
  });
  expect(weddingResponse.status()).toBe(201);
  const wedding = (await weddingResponse.json()).data;
  const base = `/api/v1/weddings/${wedding.id}`;
  const guestResponse = await request.post(`${base}/guests`, {
    headers,
    data: {
      name: "Rajesh Sharma",
      email: "private@example.com",
      notes: "Secret organizer note",
    },
  });
  expect(guestResponse.status()).toBe(201);
  const guest = (await guestResponse.json()).data;
  const events = [];
  for (const name of ["Sangeet Night", "Unassigned public ceremony"]) {
    const r = await request.post(`${base}/events`, {
      headers,
      data: {
        name,
        type: "CUSTOM",
        startsAt: "2027-12-11T13:30:00Z",
        dressCode: "Festive traditional",
        venue: {
          name: "The Courtyard",
          address: "Udaipur, Rajasthan",
          mapUrl: "https://maps.google.com/?q=Udaipur",
        },
        visibility: "PUBLIC",
      },
    });
    expect(r.status()).toBe(201);
    events.push((await r.json()).data);
  }
  expect(
    (
      await request.post(`${base}/events/${events[0].id}/guests`, {
        headers,
        data: { guestIds: [guest.id] },
      })
    ).status(),
  ).toBe(200);
  return {
    wedding,
    guest,
    base,
    events,
    path: `${base}/guests/${guest.id}/access-links`,
  };
}
const expiresAt = () => new Date(Date.now() + 86400000).toISOString();
test("RSVP writes are atomic, idempotent and limited to valid assigned capabilities", async ({
  request,
  playwright,
}) => {
  const { guest, base, events, path } = await setup(request, "rsvp-api");
  const issued = (
    await (
      await request.post(path, { headers, data: { expiresAt: expiresAt() } })
    ).json()
  ).data;
  const token = new URL(issued.url).pathname.split("/").at(-1)!;
  const auth = { ...headers, Authorization: `Bearer ${token}` };
  const anon = await playwright.request.newContext({ baseURL: headers.Origin });
  const data = { responses: [{ eventId: events[0].id, status: "ATTENDING" }] };
  try {
    expect(
      (await request.patch("/api/v1/guest/rsvps", { headers, data })).status(),
    ).toBe(401);
    expect(
      (
        await anon.patch("/api/v1/guest/rsvps", {
          headers: { ...auth, Origin: "https://evil.example" },
          data,
        })
      ).status(),
    ).toBe(403);
    for (const body of [
      { responses: [] },
      { responses: [...data.responses, ...data.responses] },
      { responses: [{ eventId: events[0].id, status: "PENDING" }] },
      { ...data, guestId: guest.id },
    ])
      expect(
        (
          await anon.patch("/api/v1/guest/rsvps", { headers: auth, data: body })
        ).status(),
      ).toBe(400);
    expect(
      (
        await anon.patch("/api/v1/guest/rsvps", {
          headers: auth,
          data: {
            responses: [
              ...data.responses,
              { eventId: events[1].id, status: "ATTENDING" },
            ],
          },
        })
      ).status(),
    ).toBe(403);
    const context = async () =>
      (
        await (
          await anon.get("/api/v1/guest/invitation", { headers: auth })
        ).json()
      ).data;
    expect((await context()).events[0].rsvpStatus).toBe("PENDING");
    const first = await anon.patch("/api/v1/guest/rsvps", {
      headers: auth,
      data,
    });
    expect(first.status()).toBe(200);
    const result = (await first.json()).data;
    expect(result.responses[0].respondedAt).toBeTruthy();
    expect(
      (
        await (
          await anon.patch("/api/v1/guest/rsvps", { headers: auth, data })
        ).json()
      ).data,
    ).toEqual(result);
    expect((await context()).events[0].rsvpStatus).toBe("ATTENDING");
    const list = (
      await (
        await request.get(
          `${base}/events/${events[0].id}/guests?rsvpStatus=ATTENDING`,
        )
      ).json()
    ).data;
    expect(list).toHaveLength(1);
    expect(list[0].rsvpStatus).toBe("ATTENDING");
    expect(list[0].respondedAt).toBe(result.responses[0].respondedAt);
    const changed = {
      responses: [{ eventId: events[0].id, status: "NOT_ATTENDING" }],
    };
    expect(
      (
        await anon.patch("/api/v1/guest/rsvps", {
          headers: auth,
          data: changed,
        })
      ).status(),
    ).toBe(200);
    expect((await context()).events[0].rsvpStatus).toBe("NOT_ATTENDING");
    await request.delete(`${base}/events/${events[0].id}/guests`, {
      headers,
      data: { guestIds: [guest.id] },
    });
    expect(
      (
        await anon.patch("/api/v1/guest/rsvps", { headers: auth, data })
      ).status(),
    ).toBe(403);
    await request.post(`${base}/events/${events[0].id}/guests`, {
      headers,
      data: { guestIds: [guest.id] },
    });
    const tokens = mongoose.connection.db!.collection("guestAccessTokens");
    await tokens.updateOne(
      { _id: new mongoose.Types.ObjectId(issued.accessTokenId) },
      { $set: { expiresAt: new Date(0) } },
    );
    expect(
      (
        await anon.patch("/api/v1/guest/rsvps", { headers: auth, data })
      ).status(),
    ).toBe(401);
    await tokens.updateOne(
      { _id: new mongoose.Types.ObjectId(issued.accessTokenId) },
      { $set: { expiresAt: new Date(Date.now() + 86400000) } },
    );
    await request.delete(`${path}/${issued.accessTokenId}`, { headers });
    expect(
      (
        await anon.patch("/api/v1/guest/rsvps", { headers: auth, data })
      ).status(),
    ).toBe(401);
    const remaining = (
      await (await request.get(`${base}/events/${events[0].id}/guests`)).json()
    ).data;
    expect(remaining[0].rsvpStatus).toBe("PENDING");
  } finally {
    await anon.dispose();
  }
});

test("guests confirm and edit RSVPs, recover a save failure, and organizers filter real responses", async ({
  page,
  context,
  browser,
}) => {
  const { wedding, base, guest, events, path } = await setup(
    context.request,
    "rsvp-ui",
  );
  const issued = (
    await (
      await context.request.post(path, {
        headers,
        data: { expiresAt: expiresAt() },
      })
    ).json()
  ).data;
  const guestContext = await browser.newContext();
  try {
    const guestPage = await guestContext.newPage();
    await guestPage.goto(issued.url);
    await guestPage.getByRole("button", { name: "Confirm responses" }).click();
    await expect(guestPage.getByRole("main").getByRole("alert")).toContainText(
      "each celebration",
    );
    await guestPage
      .getByRole("radio", { name: "Attending", exact: true })
      .check();
    await guestPage.route(
      "**/api/v1/guest/rsvps",
      async (route) => {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "Temporary save failure" },
          }),
        });
      },
      { times: 1 },
    );
    await guestPage.getByRole("button", { name: "Confirm responses" }).click();
    await expect(guestPage.getByRole("main").getByRole("alert")).toContainText(
      "Temporary save failure",
    );
    await expect(
      guestPage.getByRole("radio", { name: "Attending", exact: true }),
    ).toBeChecked();
    for (const width of [320, 1440]) {
      await guestPage.setViewportSize({ width, height: 900 });
      expect(
        await guestPage.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await guestPage.screenshot({
        path: `test-results/rsvp-form-${width}.png`,
        fullPage: true,
      });
    }
    await guestPage.getByRole("button", { name: "Confirm responses" }).click();
    await expect(
      guestPage.getByRole("heading", { name: "Thank you, Rajesh Sharma." }),
    ).toBeVisible();
    for (const width of [320, 1440]) {
      await guestPage.setViewportSize({ width, height: 900 });
      expect(
        await guestPage.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await guestPage.screenshot({
        path: `test-results/rsvp-confirmation-${width}.png`,
        fullPage: true,
      });
    }
    await guestPage
      .getByRole("button", { name: "Edit responses", exact: true })
      .click();
    await guestPage
      .getByRole("radio", { name: "Not attending", exact: true })
      .check();
    await guestPage.getByRole("button", { name: "Confirm responses" }).click();
    await expect(
      guestPage.getByText("Your responses have been saved."),
    ).toBeVisible();
    await guestPage.reload();
    await expect(
      guestPage.getByRole("radio", { name: "Not attending", exact: true }),
    ).toBeChecked();
    const organizer = `/app/weddings/${wedding.id}/events/${events[0].id}/guests`;
    await page.goto(organizer);
    await expect(
      page.getByRole("heading", { name: "Sangeet Night Guests" }),
    ).toBeVisible();
    await expect(
      page.getByText("Rajesh Sharma", { exact: true }),
    ).toBeVisible();
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: `test-results/rsvp-organizer-${width}.png`,
        fullPage: true,
      });
    }
    await page
      .getByLabel("RSVP status", { exact: true })
      .selectOption("ATTENDING");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(
      page.getByText("No guests match this view.", { exact: false }),
    ).toBeVisible();
    await page
      .getByLabel("RSVP status", { exact: true })
      .selectOption("NOT_ATTENDING");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(
      page.getByText("Rajesh Sharma", { exact: true }),
    ).toBeVisible();
    // A stale form cannot recreate an assignment removed by an organizer.
    await context.request.delete(`${base}/events/${events[0].id}/guests`, {
      headers,
      data: { guestIds: [guest.id] },
    });
    await guestPage
      .getByRole("radio", { name: "Attending", exact: true })
      .check();
    await guestPage.getByRole("button", { name: "Confirm responses" }).click();
    await expect(
      guestPage.getByRole("button", {
        name: "Reload invitation (discard edits)",
        exact: true,
      }),
    ).toBeVisible();
    await guestPage
      .getByRole("button", {
        name: "Reload invitation (discard edits)",
        exact: true,
      })
      .click();
    await expect(
      guestPage.getByText("Your celebration details are being arranged.", {
        exact: false,
      }),
    ).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
test("invitation capabilities preserve privacy, scope, expiration and revocation", async ({
  request,
  playwright,
}) => {
  const { wedding, guest, base, events, path } = await setup(
    request,
    "invitation-api",
  );
  const anon = await playwright.request.newContext({ baseURL: headers.Origin });
  try {
    expect(
      (
        await anon.post(path, { headers, data: { expiresAt: expiresAt() } })
      ).status(),
    ).toBe(401);
    expect(
      (
        await request.post(path, {
          headers: { Origin: "https://evil.example" },
          data: { expiresAt: expiresAt() },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.post(path, {
          headers,
          data: { expiresAt: "2020-01-01T00:00:00Z" },
        })
      ).status(),
    ).toBe(400);
    const create = async () => {
      const r = await request.post(path, {
        headers,
        data: { expiresAt: expiresAt() },
      });
      expect(r.status()).toBe(201);
      return (await r.json()).data;
    };
    const first = await create();
    const second = await create();
    const token = new URL(first.url).pathname.split("/").at(-1)!;
    const auth = { Authorization: `Bearer ${token}` };
    const token2 = new URL(second.url).pathname.split("/").at(-1)!;
    const tokens = mongoose.connection.db!.collection("guestAccessTokens");
    const stored = await tokens.findOne({
      _id: new mongoose.Types.ObjectId(first.accessTokenId),
    });
    expect(stored?.tokenHash).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(JSON.stringify(stored)).not.toContain(token);
    const r = await anon.get("/api/v1/guest/invitation", { headers: auth });
    expect(r.status()).toBe(200);
    expect(r.headers()["cache-control"]).toContain("no-store");
    const data = (await r.json()).data;
    expect(data.guest).toEqual({ name: "Rajesh Sharma" });
    expect(data.events.map((e: { id: string }) => e.id)).toEqual([
      events[0].id,
    ]);
    expect(JSON.stringify(data)).not.toMatch(
      /private@example|Secret organizer|createdBy|tokenHash|weddingId|guestId|visibility/,
    );
    const list = (await (await request.get(path)).json()).data;
    expect(list).toHaveLength(2);
    expect(Object.keys(list[0]).sort()).toEqual(
      [
        "id",
        "createdAt",
        "expiresAt",
        "lastUsedAt",
        "sentAt",
        "revokedAt",
      ].sort(),
    );
    expect(
      list.find((l: { id: string }) => l.id === first.accessTokenId).lastUsedAt,
    ).not.toBeNull();
    expect((await request.get("/api/v1/guest/invitation")).status()).toBe(401);
    expect((await anon.get(`${base}/guests`, { headers: auth })).status()).toBe(
      401,
    );
    const otherGuest = (
      await (
        await request.post(`${base}/guests`, {
          headers,
          data: { name: "Other guest" },
        })
      ).json()
    ).data;
    expect(
      (
        await request.delete(
          `${base}/guests/${otherGuest.id}/access-links/${first.accessTokenId}`,
          { headers },
        )
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.get(
          `/api/v1/weddings/${new mongoose.Types.ObjectId()}/guests/${guest.id}/access-links`,
        )
      ).status(),
    ).toBe(404);
    // Removing an assignment immediately changes the invitation, regardless of event visibility.
    await request.delete(`${base}/events/${events[0].id}/guests`, {
      headers,
      data: { guestIds: [guest.id] },
    });
    expect(
      (
        await (
          await anon.get("/api/v1/guest/invitation", { headers: auth })
        ).json()
      ).data.events,
    ).toEqual([]);
    expect(
      (
        await request.delete(`${path}/${first.accessTokenId}`, { headers })
      ).status(),
    ).toBe(204);
    const invalid = await anon.get("/api/v1/guest/invitation", {
      headers: auth,
    });
    expect(invalid.status()).toBe(401);
    const invalidError = (await invalid.json()).error;
    expect(
      (
        await anon.get("/api/v1/guest/invitation", {
          headers: { Authorization: `Bearer ${token2}` },
        })
      ).status(),
    ).toBe(200);
    await tokens.updateOne(
      { _id: new mongoose.Types.ObjectId(second.accessTokenId) },
      { $set: { expiresAt: new Date(0) } },
    );
    for (const candidate of [token2, "a".repeat(43), "malformed"]) {
      const response = await anon.get("/api/v1/guest/invitation", {
        headers: { Authorization: `Bearer ${candidate}` },
      });
      expect(response.status()).toBe(401);
      expect((await response.json()).error).toEqual(invalidError);
    }
    const third = await create();
    await request.delete(`${base}/guests/${guest.id}`, { headers });
    expect(
      (
        await tokens.findOne({
          _id: new mongoose.Types.ObjectId(third.accessTokenId),
        })
      )?.revokedAt,
    ).toBeTruthy();
    const thirdToken = new URL(third.url).pathname.split("/").at(-1)!;
    expect(
      (
        await anon.get("/api/v1/guest/invitation", {
          headers: { Authorization: `Bearer ${thirdToken}` },
        })
      ).status(),
    ).toBe(401);
    expect(wedding.website.isPublished).toBe(false);
  } finally {
    await anon.dispose();
  }
});
test("organizers generate and revoke links; accountless guests see responsive themed invitations", async ({
  page,
  context,
  browser,
}) => {
  const { wedding, guest, path, base } = await setup(
    context.request,
    "invitation-ui",
  );
  const details = `/app/weddings/${wedding.id}/guests/${guest.id}`;
  await page.goto(details);
  await page.getByRole("link", { name: "Preview invitation" }).click();
  await expect(
    page.getByText("Organizer preview", { exact: false }),
  ).toBeVisible();
  expect((await (await context.request.get(path)).json()).data).toEqual([]);
  await page.getByRole("link", { name: "Back to guest" }).click();
  await page.getByRole("button", { name: "Generate invitation link" }).click();
  const urlField = page.getByLabel("Your new private link");
  await expect(urlField).toBeVisible();
  const url = await urlField.inputValue();
  await expect(
    page.getByRole("link", { name: "Share on WhatsApp" }),
  ).toHaveAttribute(
    "href",
    `https://wa.me/?text=${encodeURIComponent(`You’re invited! Here is your personal wedding invitation: ${url}`)}`,
  );
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/invitation-panel-${width}.png`,
      fullPage: true,
    });
  }
  const guestContext = await browser.newContext();
  try {
    const guestPage = await guestContext.newPage();
    const response = await guestPage.goto(url);
    expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    expect(response?.headers()["cache-control"]).toContain("no-store");
    await expect(
      guestPage.getByRole("heading", {
        name: "Rajesh Sharma, you’re invited.",
      }),
    ).toBeVisible();
    await expect(
      guestPage.getByRole("heading", { name: "Sangeet Night" }),
    ).toBeVisible();
    await expect(guestPage.getByText("Unassigned public ceremony")).toHaveCount(
      0,
    );
    for (const theme of ["CLASSIC_INDIAN", "MODERN_MINIMAL", "ROYAL_INDIAN"]) {
      expect(
        (
          await context.request.patch(base, { headers, data: { theme } })
        ).status(),
      ).toBe(200);
      await guestPage.reload();
      await expect(
        guestPage.getByRole("heading", { name: "Your Celebrations" }),
      ).toBeVisible();
      for (const width of [320, 1440]) {
        await guestPage.setViewportSize({ width, height: 900 });
        expect(
          await guestPage.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        await guestPage.screenshot({
          path: `test-results/invitation-${theme}-${width}.png`,
          fullPage: true,
        });
      }
    }
    await page.reload();
    await expect(page.getByLabel("Your new private link")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Revoke link", exact: true })
      .click();
    await page.getByRole("button", { name: "Keep link" }).click();
    await page
      .getByRole("button", { name: "Revoke link", exact: true })
      .click();
    await page.getByRole("button", { name: "Confirm revoke" }).click();
    await expect(page.getByText("Invitation link revoked.")).toBeVisible();
    await guestPage.reload();
    await expect(
      guestPage.getByRole("heading", {
        name: "This invitation link is no longer available.",
      }),
    ).toBeVisible();
    await guestPage.screenshot({
      path: "test-results/invitation-unavailable.png",
      fullPage: true,
    });
  } finally {
    await guestContext.close();
  }
});
