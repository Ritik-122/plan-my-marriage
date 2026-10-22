import "server-only";
import { connectMongo } from "@/lib/db/mongoose";
import { Wedding } from "@/modules/weddings/models";
import { WeddingEvent } from "@/modules/events/model";

export async function findPublished(slug: string) {
  await connectMongo();
  return Wedding.findOne({ slug, "website.isPublished": true }).lean();
}
export async function publicEvents(weddingId: string) {
  return WeddingEvent.find({ weddingId, visibility: "PUBLIC" })
    .sort({ startsAt: 1, _id: 1 })
    .lean();
}
