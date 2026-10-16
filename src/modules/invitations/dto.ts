import type { Types } from "mongoose";
import type { AccessRecord } from "./model";
import type { WeddingRecord } from "@/modules/weddings/models";
import type { EventRecord } from "@/modules/events/model";
export function linkDTO(record: AccessRecord & { _id: Types.ObjectId }) {
  return {
    id: record._id.toString(),
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
    sentAt: record.sentAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
  };
}
export type LinkDTO = ReturnType<typeof linkDTO>;
export function invitationDTO(
  guest: { name: string },
  wedding: WeddingRecord,
  events: (EventRecord & { _id: Types.ObjectId; rsvpStatus: string })[],
) {
  return {
    guest: { name: guest.name },
    wedding: {
      brideName: wedding.brideName,
      groomName: wedding.groomName,
      weddingDate: wedding.weddingDate.toISOString(),
      theme: wedding.theme,
      description: wedding.description,
      city: wedding.city,
    },
    events: events.map((e) => ({
      id: e._id.toString(),
      name: e.name,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt?.toISOString() ?? null,
      dressCode: e.dressCode,
      venue: {
        name: e.venue?.name ?? "",
        address: e.venue?.address ?? "",
        mapUrl: e.venue?.mapUrl ?? "",
      },
      livestreamUrl: e.livestreamUrl ?? null,
      rsvpStatus: e.rsvpStatus,
    })),
  };
}
export type InvitationDTO = ReturnType<typeof invitationDTO>;
