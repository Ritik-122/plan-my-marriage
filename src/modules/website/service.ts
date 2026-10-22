import "server-only";
import { getWedding } from "@/modules/weddings/service";
import { HttpError } from "@/lib/http/errors";
import { publicWebsiteDTO } from "./dto";
import * as repository from "./repository";

export async function publicWebsite(slug: string) {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    slug.length < 3 ||
    slug.length > 80
  )
    throw new HttpError(404, "NOT_FOUND", "Website not found.");
  const wedding = await repository.findPublished(slug);
  if (!wedding) throw new HttpError(404, "NOT_FOUND", "Website not found.");
  return publicWebsiteDTO(
    wedding,
    await repository.publicEvents(wedding._id.toString()),
  );
}
export async function previewWebsite(userId: string, weddingId: string) {
  const wedding = await getWedding(userId, weddingId);
  return publicWebsiteDTO(
    { ...wedding, weddingDate: new Date(wedding.weddingDate) },
    await repository.publicEvents(wedding.id),
  );
}
