import type { PhotoRecord } from "./model";
import { photoUrl } from "@/integrations/media/r2";
export function photoDTO(row: PhotoRecord & { _id: { toString(): string } }) {
  return {
    id: row._id.toString(),
    eventId: row.eventId?.toString() ?? null,
    purpose: row.purpose,
    originalFileName: row.originalFileName,
    url: photoUrl(row.objectKey),
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadedByType: row.uploadedByType,
    createdAt: row.createdAt.toISOString(),
  };
}
export type PhotoDTO = ReturnType<typeof photoDTO>;
