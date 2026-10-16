import "server-only";
import { getWedding } from "@/modules/weddings/service";
import { eventDTO } from "./dto";
import * as repository from "./repository";
import type { EventInput, EventUpdate, EventFilters } from "./schema";
const validId = (id: string) => {
  if (!/^[a-f\d]{24}$/i.test(id)) throw repository.missingEvent();
};
export async function listEvents(
  userId: string,
  weddingId: string,
  filters: EventFilters = {},
) {
  await getWedding(userId, weddingId);
  return (await repository.listRecords(weddingId, filters)).map(eventDTO);
}
export async function getEvent(
  userId: string,
  weddingId: string,
  eventId: string,
) {
  await getWedding(userId, weddingId);
  validId(eventId);
  const event = await repository.getRecord(weddingId, eventId);
  if (!event) throw repository.missingEvent();
  return eventDTO(event);
}
export async function createEvent(
  userId: string,
  weddingId: string,
  input: EventInput,
) {
  await getWedding(userId, weddingId);
  return eventDTO(await repository.createRecord(weddingId, userId, input));
}
export async function updateEvent(
  userId: string,
  weddingId: string,
  eventId: string,
  input: EventUpdate,
) {
  await getWedding(userId, weddingId);
  validId(eventId);
  return eventDTO(await repository.updateRecord(weddingId, eventId, input));
}
export async function deleteEvent(
  userId: string,
  weddingId: string,
  eventId: string,
) {
  await getWedding(userId, weddingId);
  validId(eventId);
  await repository.deleteRecord(weddingId, eventId);
}
