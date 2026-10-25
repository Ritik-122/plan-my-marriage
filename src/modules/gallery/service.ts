import "server-only";
import { getWedding } from "@/modules/weddings/service";
import { getMediaConfig } from "@/lib/config/env.server";
import { HttpError } from "@/lib/http/errors";
import { presignObject } from "@/integrations/media/r2";
import * as repository from "./repository";
import { photoDTO } from "./dto";
import type { PresignInput, FinalizeInput, PhotoFilters } from "./schema";
export async function presign(
  userId: string,
  weddingId: string,
  input: PresignInput,
) {
  await getWedding(userId, weddingId);
  if (input.sizeBytes > getMediaConfig().MAX_IMAGE_BYTES)
    throw new HttpError(
      400,
      "UPLOAD_INVALID",
      "This photo exceeds the upload size limit.",
    );
  const intent = await repository.createIntent(userId, weddingId, input);
  return {
    objectKey: intent.objectKey,
    ...(await presignObject(
      intent.stagingKey,
      input.mimeType,
      input.sizeBytes,
    )),
  };
}
export async function finalize(
  userId: string,
  weddingId: string,
  input: FinalizeInput,
) {
  await getWedding(userId, weddingId);
  getMediaConfig();
  return {
    photo: photoDTO(await repository.finalizeRecord(userId, weddingId, input)),
  };
}
export async function listPhotos(
  userId: string,
  weddingId: string,
  input: PhotoFilters,
) {
  await getWedding(userId, weddingId);
  const rows = await repository.listRecords(weddingId, input);
  const data = rows.slice(0, input.limit).map(photoDTO);
  const last = data.at(-1);
  return {
    data,
    nextCursor:
      rows.length > input.limit && last
        ? Buffer.from(
            JSON.stringify({ date: last.createdAt, id: last.id }),
          ).toString("base64url")
        : null,
  };
}
function validateId(photoId: string) {
  if (!/^[a-f\d]{24}$/i.test(photoId)) throw repository.missingPhoto();
}
export async function getPhoto(
  userId: string,
  weddingId: string,
  photoId: string,
) {
  await getWedding(userId, weddingId);
  validateId(photoId);
  const row = await repository.getRecord(weddingId, photoId);
  if (!row) throw repository.missingPhoto();
  return photoDTO(row);
}
export async function deletePhoto(
  userId: string,
  weddingId: string,
  photoId: string,
) {
  await getWedding(userId, weddingId);
  validateId(photoId);
  getMediaConfig();
  await repository.removeRecord(userId, weddingId, photoId);
}
export async function photoSummary(userId: string, weddingId: string) {
  await getWedding(userId, weddingId);
  return repository.summary(weddingId);
}
