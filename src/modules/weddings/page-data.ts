import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "@/lib/http/errors";
import { getWedding, listWeddings } from "./service";
export async function weddingForPage(userId: string, weddingId: string) {
  try {
    return await getWedding(userId, weddingId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw new Error("Wedding data is temporarily unavailable.");
  }
}
export async function weddingsForPage(userId: string) {
  try {
    return await listWeddings(userId);
  } catch {
    throw new Error("Wedding data is temporarily unavailable.");
  }
}
