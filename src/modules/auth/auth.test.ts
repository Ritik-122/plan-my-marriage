import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import {
  createSession,
  readSession,
  SESSION_SECONDS,
  sessionCookieOptions,
} from "./session";
import { loginSchema, registerSchema } from "./schema";
import { hashPassword, verifyPassword } from "./password";
import { authenticate, register, login } from "./service";
import * as repository from "./repository";
import { toUserDTO } from "./dto";

vi.mock("./repository", () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
}));
const secret = "test-session-secret-with-at-least-32-characters";
const id = "68d0a0010000000000000001";
beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", secret);
  vi.resetAllMocks();
});

describe("account input", () => {
  it("normalizes email/name, preserves password, and rejects unexpected fields", () => {
    const password = "  twelve characters  ";
    expect(
      registerSchema.parse({
        displayName: " Ritik ",
        email: " RITIK@example.COM ",
        password,
      }),
    ).toEqual({ displayName: "Ritik", email: "ritik@example.com", password });
    expect(
      registerSchema.safeParse({
        displayName: "Ritik",
        email: "r@example.com",
        password,
        role: "ADMIN",
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "r@example.com", password: "a" }).success,
    ).toBe(true);
  });
  it("rejects short registration passwords and multibyte bcrypt truncation", () => {
    expect(
      registerSchema.safeParse({
        displayName: "Ritik",
        email: "r@example.com",
        password: "short",
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "r@example.com",
        password: "😀".repeat(19),
      }).success,
    ).toBe(false);
  });
});

describe("signed sessions", () => {
  it("accepts a signed session and rejects tampering", async () => {
    const token = await createSession(id, 1);
    expect(await readSession(token)).toMatchObject({
      sub: id,
      sessionVersion: 1,
    });
    const [header, payload, signature] = token.split(".");
    expect(
      await readSession(
        `${header}.${payload}.${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`,
      ),
    ).toBeNull();
    expect(await readSession()).toBeNull();
  });
  it("rejects expired, future-dated, overlong and wrong-audience sessions", async () => {
    const now = Math.floor(Date.now() / 1000);
    for (const [issued, expiry, audience] of [
      [now - 20, now - 1, "pmm-app"],
      [now + 60, now + 120, "pmm-app"],
      [now, now + SESSION_SECONDS + 60, "pmm-app"],
      [now, now + 60, "other-app"],
    ] as const) {
      const token = await new SignJWT({ sessionVersion: 1 })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(id)
        .setIssuedAt(issued)
        .setExpirationTime(expiry)
        .setIssuer("plan-my-marriage")
        .setAudience(audience)
        .sign(new TextEncoder().encode(secret));
      expect(await readSession(token)).toBeNull();
    }
  });
  it("uses HttpOnly, SameSite cookies and Secure for HTTPS", () => {
    vi.stubEnv("APP_BASE_URL", "https://plan.example.com");
    expect(sessionCookieOptions()).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_SECONDS,
    });
  });
  it("checks the persisted session version and deleted accounts", async () => {
    const token = await createSession(id, 1);
    vi.mocked(repository.findUserById).mockResolvedValue(null);
    expect(await authenticate(token)).toBeNull();
    vi.mocked(repository.findUserById).mockResolvedValue({
      _id: id,
      displayName: "Ritik",
      email: "r@example.com",
      sessionVersion: 2,
    } as never);
    expect(await authenticate(token)).toBeNull();
    expect(await authenticate("bad-token")).toBeNull();
    expect(repository.findUserById).toHaveBeenCalledTimes(2);
  });
});

describe("passwords and account service", () => {
  it("salts hashes and verifies without exposing passwords", async () => {
    const hash = await hashPassword("our long password");
    expect(hash).not.toContain("our long password");
    expect(await verifyPassword("our long password", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("wrong")).toBe(false);
  });
  it("uses the same credentials error for absent accounts", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    await expect(
      login({ email: "missing@example.com", password: "wrong" }),
    ).rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
  });
  it("maps concurrent duplicate registration to conflict", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(repository.createUser).mockRejectedValue({ code: 11000 });
    await expect(
      register({
        displayName: "Ritik",
        email: "r@example.com",
        password: "our long password",
      }),
    ).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repository.createUser).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: "our long password" }),
    );
  });
  it("serializes only public identity fields", () => {
    expect(
      toUserDTO({
        _id: id,
        displayName: "Ritik",
        email: "r@example.com",
        passwordHash: "secret",
        sessionVersion: 2,
      } as never),
    ).toEqual({ id, displayName: "Ritik", email: "r@example.com" });
  });
});
