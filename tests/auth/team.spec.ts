import {
  expect,
  test,
  type BrowserContext,
  type APIRequestContext,
} from "@playwright/test";
import mongoose from "mongoose";
import { SignJWT } from "jose";
import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
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
async function account(context: BrowserContext, email: string) {
  const _id = new mongoose.Types.ObjectId();
  await mongoose.connection.db!.collection("users").insertOne({
    _id,
    email,
    displayName: email.split("@")[0],
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
async function wedding(request: APIRequestContext, slug: string) {
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
  return (await response.json()).data.id as string;
}
async function invitation(
  request: APIRequestContext,
  base: string,
  email: string,
  role = "MANAGER",
) {
  const response = await request.post(`${base}/member-invitations`, {
    headers,
    data: { email, role },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data;
}
async function mailToken(email: string) {
  const mail = await mongoose.connection
    .db!.collection("testMailOutbox")
    .findOne({ to: email }, { sort: { createdAt: -1 } });
  expect(mail).toBeTruthy();
  return /accept#([A-Za-z0-9_-]{43})/.exec(mail!.text)![1];
}
test("team invitation authorization, rotation, acceptance, failure and removal", async ({
  browser,
  context,
}) => {
  const request = context.request;
  await account(context, "team-owner@example.com");
  const id = await wedding(request, "team-security");
  const base = `/api/v1/weddings/${id}`;
  const partnerContext = await browser.newContext({ baseURL: origin });
  const managerContext = await browser.newContext({ baseURL: origin });
  const outsiderContext = await browser.newContext({ baseURL: origin });
  try {
    await account(partnerContext, "team-partner@example.com");
    await account(managerContext, "team-manager@example.com");
    await account(outsiderContext, "team-outsider@example.com");
    const outsider = outsiderContext.request;
    expect((await outsider.get(`${base}/members`)).status()).toBe(404);
    expect(
      (
        await outsider.post(`${base}/member-invitations`, {
          headers,
          data: { email: "x@example.com" },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.post(`${base}/member-invitations`, {
          headers: { Origin: "https://evil.example" },
          data: { email: "x@example.com" },
        })
      ).status(),
    ).toBe(403);
    const invite = await invitation(
      request,
      base,
      "team-partner@example.com",
      "ADMIN",
    );
    expect(invite.tokenHash).toBeUndefined();
    expect(invite.providerMessageId).toBeUndefined();
    const token = await mailToken("team-partner@example.com");
    const stored = await mongoose.connection
      .db!.collection("memberInvitations")
      .findOne({ _id: new mongoose.Types.ObjectId(invite.id) });
    expect(stored!.tokenHash).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(JSON.stringify(stored)).not.toContain(token);
    expect(
      (
        await request.post(`${base}/member-invitations`, {
          headers,
          data: { email: "TEAM-PARTNER@example.com" },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await outsider.post("/api/v1/member-invitations/accept", {
          headers,
          data: { token },
        })
      ).status(),
    ).toBe(403);
    const accepted = await partnerContext.request.post(
      "/api/v1/member-invitations/accept",
      { headers, data: { token } },
    );
    expect(accepted.status()).toBe(200);
    expect((await accepted.json()).data.role).toBe("ADMIN");
    expect(
      (
        await partnerContext.request.post("/api/v1/member-invitations/accept", {
          headers,
          data: { token },
        })
      ).status(),
    ).toBe(200);
    const managerInvite = await invitation(
      partnerContext.request,
      base,
      "team-manager@example.com",
    );
    const oldToken = await mailToken("team-manager@example.com");
    const rotated = await request.post(
      `${base}/member-invitations/${managerInvite.id}/resend`,
      { headers },
    );
    expect(rotated.status()).toBe(201);
    expect(
      (
        await managerContext.request.post("/api/v1/member-invitations/accept", {
          headers,
          data: { token: oldToken },
        })
      ).status(),
    ).toBe(410);
    const managerToken = await mailToken("team-manager@example.com");
    expect(
      (
        await managerContext.request.post("/api/v1/member-invitations/accept", {
          headers,
          data: { token: managerToken, role: "ADMIN" },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await managerContext.request.post("/api/v1/member-invitations/accept", {
          headers,
          data: { token: managerToken },
        })
      ).status(),
    ).toBe(200);
    expect((await managerContext.request.get(`${base}/members`)).status()).toBe(
      200,
    );
    expect(
      (await managerContext.request.get(`${base}/member-invitations`)).status(),
    ).toBe(403);
    expect(
      (
        await managerContext.request.post(`${base}/member-invitations`, {
          headers,
          data: { email: "x@example.com" },
        })
      ).status(),
    ).toBe(403);
    const members = (await (await request.get(`${base}/members`)).json()).data;
    const admin = members.find((m: { role: string }) => m.role === "ADMIN");
    const manager = members.find((m: { role: string }) => m.role === "MANAGER");
    expect(
      (
        await request.delete(`${base}/members/${admin.id}`, { headers })
      ).status(),
    ).toBe(403);
    expect(
      (
        await managerContext.request.delete(`${base}/members/${admin.id}`, {
          headers,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.delete(`${base}/members/${manager.id}`, { headers })
      ).status(),
    ).toBe(204);
    expect((await managerContext.request.get(base)).status()).toBe(404);
    expect(
      (
        await managerContext.request.post("/api/v1/member-invitations/accept", {
          headers,
          data: { token: managerToken },
        })
      ).status(),
    ).toBe(410);
    const revoke = await invitation(request, base, "revoked@example.com");
    const revokedToken = await mailToken("revoked@example.com");
    expect(
      (
        await request.delete(`${base}/member-invitations/${revoke.id}`, {
          headers,
        })
      ).status(),
    ).toBe(204);
    expect(
      (
        await outsider.get("/api/v1/member-invitations/context", {
          headers: { Authorization: `Bearer ${revokedToken}` },
        })
      ).status(),
    ).toBe(410);
    const failed = await request.post(`${base}/member-invitations`, {
      headers,
      data: { email: "failure-email@example.com" },
    });
    expect(failed.status()).toBe(502);
    expect(await failed.text()).not.toContain("PRIVATE PROVIDER ERROR");
    const failedRecord = await mongoose.connection
      .db!.collection("memberInvitations")
      .findOne({ email: "failure-email@example.com" });
    expect(failedRecord!.sentAt).toBeNull();
    expect(failedRecord!.deliveryState).toBe("FAILED");
    const race = await Promise.all([
      request.post(`${base}/member-invitations`, {
        headers,
        data: { email: "race-team@example.com" },
      }),
      request.post(`${base}/member-invitations`, {
        headers,
        data: { email: "race-team@example.com" },
      }),
    ]);
    expect(race.map((r) => r.status()).sort()).toEqual([201, 409]);
    const raceToken = await mailToken("race-team@example.com");
    await mongoose.connection
      .db!.collection("memberInvitations")
      .updateOne(
        { email: "race-team@example.com" },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
      );
    expect(
      (
        await outsider.get("/api/v1/member-invitations/context", {
          headers: { Authorization: `Bearer ${raceToken}` },
        })
      ).status(),
    ).toBe(410);
  } finally {
    await partnerContext.close();
    await managerContext.close();
    await outsiderContext.close();
  }
});
test("Stitch team screens, confirmation, invitation acceptance and responsive layouts", async ({
  page,
  context,
  browser,
}, testInfo) => {
  const request = context.request;
  await account(context, "team-ui-owner@example.com");
  const id = await wedding(request, "team-ui");
  await page.goto(`/app/weddings/${id}/team`);
  await expect(
    page.getByRole("heading", { name: "Team & Access" }),
  ).toBeVisible();
  await expect(
    page.getByText("team-ui-owner@example.com", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`team-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Invite Partner" }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("team-ui-partner@example.com");
  await page.screenshot({ path: testInfo.outputPath("invite-partner.png") });
  await page
    .getByRole("button", { name: "Send invitation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Invitation sent");
  const token = await mailToken("team-ui-partner@example.com");
  const recipientContext = await browser.newContext({ baseURL: origin });
  try {
    const recipient = await recipientContext.newPage();
    await recipient.goto(`/member-invitations/accept#${token}`);
    await expect(
      recipient.getByRole("heading", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await account(recipientContext, "team-ui-partner@example.com");
    await mongoose.connection.db!.collection("users").updateOne(
      { email: "team-ui-partner@example.com" },
      {
        $set: {
          passwordHash: await hash("Team invitation password 2027!", 12),
        },
      },
    );
    await recipientContext.clearCookies();
    await recipient.reload();
    await recipient
      .getByLabel("Email address", { exact: true })
      .fill("team-ui-partner@example.com");
    await recipient
      .getByLabel("Password", { exact: true })
      .fill("Team invitation password 2027!");
    await recipient
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(
      recipient.getByText("Your email matches this invitation."),
    ).toBeVisible();
    for (const width of [320, 1440]) {
      await recipient.setViewportSize({ width, height: 1000 });
      expect(
        await recipient.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await recipient.screenshot({
        path: testInfo.outputPath(`accept-${width}.png`),
        fullPage: true,
      });
    }
    await recipient
      .getByRole("button", { name: "Accept invitation", exact: true })
      .click();
    await expect(recipient).toHaveURL(`/app/weddings/${id}`);
  } finally {
    await recipientContext.close();
  }
  await page
    .getByRole("button", { name: "Invite Manager", exact: true })
    .click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("team-ui-helper@example.com");
  await page
    .getByRole("button", { name: "Send invitation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const item = page
    .getByRole("listitem")
    .filter({ hasText: "team-ui-helper@example.com" });
  await item.getByRole("button", { name: "Revoke", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(item.getByText("Manager · Pending acceptance")).toBeVisible();
  await item.getByRole("button", { name: "Revoke", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("revoke-confirm.png") });
  await page
    .getByRole("button", { name: "Revoke invitation", exact: true })
    .click();
  await expect(item.getByText("Manager · Revoked")).toBeVisible();
});
