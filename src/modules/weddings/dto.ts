import type { Theme } from "./schema";
import type { WeddingRecord } from "./models";
export type WeddingRole = "ADMIN" | "MANAGER";
export type WeddingDTO = {
  id: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  city: string;
  slug: string;
  theme: Theme;
  description: string;
  timezone: string;
  website: {
    isPublished: boolean;
    showGallery: boolean;
    showLivestream: boolean;
  };
  role: WeddingRole;
};
export function toWeddingDTO(
  wedding: WeddingRecord & { _id: { toString(): string } },
  role: WeddingRole,
): WeddingDTO {
  return {
    id: wedding._id.toString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    weddingDate: wedding.weddingDate.toISOString(),
    city: wedding.city,
    slug: wedding.slug,
    theme: wedding.theme,
    description: wedding.description,
    timezone: wedding.timezone,
    website: {
      isPublished: wedding.website?.isPublished ?? false,
      showGallery: wedding.website?.showGallery ?? true,
      showLivestream: wedding.website?.showLivestream ?? true,
    },
    role,
  };
}
