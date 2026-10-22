import type { WeddingRecord } from "@/modules/weddings/models";
import type { EventRecord } from "@/modules/events/model";
import type { Theme } from "@/modules/weddings/schema";

export function safePublicLink(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

// An explicit allowlist, shared by the public website and authenticated preview.
// Never spread organizer DTOs or documents into a guest response.
export function publicWebsiteDTO(
  wedding: Pick<
    WeddingRecord,
    | "brideName"
    | "groomName"
    | "weddingDate"
    | "city"
    | "slug"
    | "theme"
    | "description"
    | "timezone"
  >,
  events: (EventRecord & { _id: { toString(): string } })[],
) {
  return {
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    weddingDate: wedding.weddingDate.toISOString(),
    city: wedding.city,
    slug: wedding.slug,
    theme: wedding.theme as Theme,
    description: wedding.description,
    timezone: wedding.timezone,
    events: events
      .filter((e) => e.visibility === "PUBLIC")
      .map((e) => ({
        id: e._id.toString(),
        name: e.name,
        type: e.type,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt?.toISOString() ?? null,
        description: e.description,
        dressCode: e.dressCode,
        venue: {
          name: e.venue?.name ?? "",
          address: e.venue?.address ?? "",
          mapUrl: safePublicLink(e.venue?.mapUrl),
        },
      })),
  };
}
export type PublicWebsiteDTO = ReturnType<typeof publicWebsiteDTO>;
