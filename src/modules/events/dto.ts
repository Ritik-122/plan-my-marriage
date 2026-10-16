import type { EventRecord } from "./model";
export function eventDTO(event: EventRecord & { _id: { toString(): string } }) {
  return {
    id: event._id.toString(),
    weddingId: event.weddingId.toString(),
    name: event.name,
    type: event.type,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    description: event.description,
    dressCode: event.dressCode,
    venue: {
      name: event.venue?.name ?? "",
      address: event.venue?.address ?? "",
      mapUrl: event.venue?.mapUrl ?? "",
    },
    livestreamUrl: event.livestreamUrl ?? null,
    visibility: event.visibility ?? "INVITED_ONLY",
  };
}
export type EventDTO = ReturnType<typeof eventDTO>;
