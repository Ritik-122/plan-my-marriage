import "server-only";
import { getWedding } from "@/modules/weddings/service";
import { getEvent } from "@/modules/events/service";
import { guestDTO } from "./dto";
import * as repository from "./repository";
import type { GuestInput, GuestUpdate, GuestFilters } from "./schema";
export async function eventRsvpCounts(
  userId: string,
  weddingId: string,
  eventId: string,
) {
  await getEvent(userId, weddingId, eventId);
  return repository.eventResponseCounts(weddingId, eventId);
}
function validId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw repository.missingGuest();
}
export async function listGuests(
  userId: string,
  weddingId: string,
  filters: GuestFilters,
) {
  await getWedding(userId, weddingId);
  if (filters.eventId) await getEvent(userId, weddingId, filters.eventId);
  return repository.listRecords(weddingId, filters);
}
export async function getGuest(
  userId: string,
  weddingId: string,
  guestId: string,
) {
  await getWedding(userId, weddingId);
  validId(guestId);
  const guest = await repository.getRecord(weddingId, guestId);
  if (!guest) throw repository.missingGuest();
  return guestDTO(guest);
}
export async function createGuest(
  userId: string,
  weddingId: string,
  input: GuestInput,
) {
  await getWedding(userId, weddingId);
  return guestDTO(await repository.createRecord(weddingId, userId, input));
}
export async function updateGuest(
  userId: string,
  weddingId: string,
  guestId: string,
  input: GuestUpdate,
) {
  await getWedding(userId, weddingId);
  validId(guestId);
  const guest = await repository.updateRecord(weddingId, guestId, input);
  if (!guest) throw repository.missingGuest();
  return guestDTO(guest);
}
export async function deleteGuest(
  userId: string,
  weddingId: string,
  guestId: string,
) {
  await getWedding(userId, weddingId);
  validId(guestId);
  await repository.deleteRecord(weddingId, guestId);
}
export async function guestEvents(
  userId: string,
  weddingId: string,
  guestId: string,
) {
  await getGuest(userId, weddingId, guestId);
  return repository.assignedEvents(weddingId, guestId);
}
export async function assignGuests(
  userId: string,
  weddingId: string,
  eventId: string,
  guestIds: string[],
  remove = false,
) {
  await getEvent(userId, weddingId, eventId);
  guestIds.forEach(validId);
  return repository.changeAssignments(weddingId, eventId, guestIds, remove);
}
