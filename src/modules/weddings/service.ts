import "server-only";
import { HttpError } from "@/lib/http/errors";
import * as repository from "./repository";
import { toWeddingDTO } from "./dto";
import type { CreateWeddingInput, UpdateWeddingInput } from "./schema";

const notFound = () => new HttpError(404, "NOT_FOUND", "Wedding not found.");
export async function listWeddings(userId: string) {
  const members = await repository.memberships(userId);
  const weddings = await repository.findWeddings(
    members.map((m) => m.weddingId.toString()),
  );
  return members.flatMap((member) => {
    const wedding = weddings.find((w) => w._id.equals(member.weddingId));
    return wedding ? [toWeddingDTO(wedding, member.role)] : [];
  });
}
async function requireMembership(userId: string, weddingId: string) {
  if (!/^[a-f\d]{24}$/i.test(weddingId)) throw notFound();
  const member = await repository.findMembership(userId, weddingId);
  if (!member || !["ADMIN", "MANAGER"].includes(member.role)) throw notFound();
  return member;
}
export async function getWedding(userId: string, weddingId: string) {
  const member = await requireMembership(userId, weddingId);
  const wedding = await repository.findWedding(weddingId);
  if (!wedding) throw notFound();
  return toWeddingDTO(wedding, member.role);
}
export async function createWedding(userId: string, input: CreateWeddingInput) {
  try {
    return toWeddingDTO(
      await repository.createWithAdmin(userId, input),
      "ADMIN",
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    )
      throw new HttpError(
        409,
        "CONFLICT",
        "That website handle is already taken. Choose another.",
        { slug: "Choose a different website handle." },
      );
    throw error;
  }
}
export async function updateWedding(
  userId: string,
  weddingId: string,
  input: UpdateWeddingInput,
) {
  const member = await requireMembership(userId, weddingId);
  const wedding = await repository.updateWeddingRecord(weddingId, input);
  if (!wedding) throw notFound();
  return toWeddingDTO(wedding, member.role);
}
