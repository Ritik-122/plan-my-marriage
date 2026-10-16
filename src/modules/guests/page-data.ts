import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "@/lib/http/errors";
import { getGuest, guestEvents, listGuests } from "./service";
import type { GuestFilters } from "./schema";
async function safe<T>(call: () => Promise<T>) {
  try {
    return await call();
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw new Error("Guest data is temporarily unavailable.");
  }
}
export const guestForPage = (
  userId: string,
  weddingId: string,
  guestId: string,
) => safe(() => getGuest(userId, weddingId, guestId));
export const guestEventsForPage = (
  userId: string,
  weddingId: string,
  guestId: string,
) => safe(() => guestEvents(userId, weddingId, guestId));
export const guestsForPage = (
  userId: string,
  weddingId: string,
  filters: GuestFilters,
) => safe(() => listGuests(userId, weddingId, filters));
