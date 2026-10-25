import type { NextRequest } from "next/server";
import { handleGallery } from "@/modules/gallery/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; photoId: string }> },
) {
  const params = await context.params;
  return handleGallery(request, params.weddingId, "photos", params.photoId);
}
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; photoId: string }> },
) {
  const params = await context.params;
  return handleGallery(request, params.weddingId, "photos", params.photoId);
}
