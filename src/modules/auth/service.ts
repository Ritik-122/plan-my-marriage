import "server-only";
import { HttpError } from "@/lib/http/errors";
import { getSessionConfig } from "@/lib/config/env.server";
import { toUserDTO } from "./dto";
import { createUser, findUserByEmail, findUserById } from "./repository";
import { hashPassword, verifyPassword } from "./password";
import { createSession, readSession } from "./session";
import type { LoginInput, RegisterInput } from "./schema";

export async function register(input: RegisterInput) {
  getSessionConfig();
  if (await findUserByEmail(input.email))
    throw new HttpError(
      409,
      "CONFLICT",
      "An account with this email already exists.",
    );
  try {
    const user = await createUser({
      displayName: input.displayName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });
    return {
      user: toUserDTO(user),
      token: await createSession(user._id.toString(), user.sessionVersion),
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new HttpError(
        409,
        "CONFLICT",
        "An account with this email already exists.",
      );
    }
    throw error;
  }
}
export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!(await verifyPassword(input.password, user?.passwordHash)) || !user) {
    throw new HttpError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }
  return {
    user: toUserDTO(user),
    token: await createSession(user._id.toString(), user.sessionVersion),
  };
}
export async function authenticate(token?: string) {
  const session = await readSession(token);
  if (!session) return null;
  const user = await findUserById(session.sub);
  if (!user || user.sessionVersion !== session.sessionVersion) return null;
  return toUserDTO(user);
}
