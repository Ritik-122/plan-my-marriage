import { expect, test } from "@playwright/test";

const origin = "http://127.0.0.1:3111";
const password = "Our wedding plans 2027!";
test("register, persist a session, sign out, and sign in again", async ({
  page,
  context,
}) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Your name").fill("Ritik Test");
  await page.getByLabel("Email address").fill("  RITIK@EXAMPLE.COM  ");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Ritik Test." }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as ritik@example.com")).toBeVisible();
  const cookie = (await context.cookies()).find(
    (item) => item.name === "pmm_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "pmm_session",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome, Ritik Test." }),
  ).toBeVisible();
  const me = await context.request.get("/api/v1/auth/me");
  expect(me.status()).toBe(200);
  const body = await me.json();
  expect(Object.keys(body.data.user).sort()).toEqual([
    "displayName",
    "email",
    "id",
  ]);
  expect(me.headers()["cache-control"]).toContain("no-store");
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect((await context.request.get("/api/v1/auth/me")).status()).toBe(401);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email address").fill("ritik@example.com");
  await page.getByLabel("Password", { exact: true }).fill("incorrect password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Email or password is incorrect.",
  );
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test("API rejects duplicate accounts, forged sessions, CSRF, malformed data and repeated attempts", async ({
  request,
}) => {
  const headers = { Origin: origin };
  const data = {
    displayName: "Duplicate",
    email: "duplicate@example.com",
    password,
  };
  const results = await Promise.all([
    request.post("/api/v1/auth/register", { headers, data }),
    request.post("/api/v1/auth/register", { headers, data }),
  ]);
  expect(results.map((result) => result.status()).sort()).toEqual([201, 409]);
  expect(
    (
      await request.post("/api/v1/auth/logout", {
        headers: { Origin: "https://other.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/v1/auth/login", {
        data: { email: data.email, password },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/v1/auth/logout", { headers })).status(),
  ).toBe(204);
  expect(
    (
      await request.get("/api/v1/auth/me", {
        headers: { Cookie: "pmm_session=forged" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/v1/auth/register", {
        headers,
        data: { ...data, email: "invalid", password: "short" },
      })
    ).status(),
  ).toBe(400);
  const failures = [];
  for (const email of ["missing@example.com", "duplicate@example.com"]) {
    const response = await request.post("/api/v1/auth/login", {
      headers,
      data: { email, password: "wrong password" },
    });
    expect(response.status()).toBe(401);
    failures.push((await response.json()).error);
  }
  expect(failures[0]).toEqual(failures[1]);
  for (let i = 0; i < 8; i++)
    await request.post("/api/v1/auth/login", {
      headers,
      data: { email: "limited@example.com", password: "wrong password" },
    });
  const limited = await request.post("/api/v1/auth/login", {
    headers,
    data: { email: "limited@example.com", password: "wrong password" },
  });
  expect(limited.status()).toBe(429);
  expect(limited.headers()["retry-after"]).toBeTruthy();
});

for (const width of [320, 1440]) {
  test(`account forms fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/sign-in", "/sign-up"]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: `test-results/${path.slice(1)}-${width}.png`,
        fullPage: true,
      });
    }
  });
}
