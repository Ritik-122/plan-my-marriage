import "server-only";
import { connectMongo } from "@/lib/db/mongoose";
import { HttpError } from "@/lib/http/errors";
import { User } from "./user.model";

export async function findUserByEmail(email: string) {
  await connectMongo();
  return User.findOne({ email })
    .select("+passwordHash +sessionVersion")
    .lean()
    .exec();
}
export async function findUserById(id: string) {
  await connectMongo();
  return User.findById(id).select("+sessionVersion").lean().exec();
}
export async function createUser(input: {
  displayName: string;
  email: string;
  passwordHash: string;
}) {
  await connectMongo();
  // Production indexes are deployed explicitly, never created on application boot.
  // Refuse registration if the uniqueness guarantee is missing.
  await User.init();
  const indexes = await User.collection.indexes();
  if (
    !indexes.some(
      (index) =>
        index.unique &&
        index.key.email === 1 &&
        Object.keys(index.key).length === 1 &&
        !index.partialFilterExpression &&
        !index.sparse,
    )
  ) {
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Account service is temporarily unavailable. Please try again later.",
    );
  }
  return User.create(input);
}
