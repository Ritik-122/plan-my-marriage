import "server-only";
import { compare, hash } from "bcryptjs";

const cost = 12;
// A valid cost-12 hash keeps unknown-account checks comparable to real logins.
const dummyHash =
  "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
export function hashPassword(password: string) {
  return hash(password, cost);
}
export async function verifyPassword(password: string, passwordHash?: string) {
  const matches = await compare(password, passwordHash ?? dummyHash);
  return Boolean(passwordHash) && matches;
}
