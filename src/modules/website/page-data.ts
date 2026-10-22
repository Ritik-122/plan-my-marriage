import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "@/lib/http/errors";
import { publicWebsite, previewWebsite } from "./service";
export async function publicWebsiteForPage(slug: string) {
  try {
    return await publicWebsite(slug);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw new Error("Wedding website is temporarily unavailable.");
  }
}
export async function previewForPage(userId: string, weddingId: string) {
  try {
    return await previewWebsite(userId, weddingId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw new Error("Wedding website preview is temporarily unavailable.");
  }
}
