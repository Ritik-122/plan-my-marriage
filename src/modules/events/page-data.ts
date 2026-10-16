import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "@/lib/http/errors";
import { getEvent, listEvents } from "./service";
export async function eventForPage(
  userId: string,
  weddingId: string,
  eventId: string,
) {
  try {
    return await getEvent(userId, weddingId, eventId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw new Error("Event data is temporarily unavailable.");
  }
}
export async function eventsForPage(userId: string, weddingId: string) {
  try {
    return await listEvents(userId, weddingId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw new Error("Event data is temporarily unavailable.");
  }
}
