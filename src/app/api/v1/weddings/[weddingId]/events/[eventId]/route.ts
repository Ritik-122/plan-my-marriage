import type { NextRequest } from "next/server";
import { handleEvent } from "@/modules/events/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ weddingId: string; eventId: string }> };
export async function GET(request: NextRequest, context: Context) {
  const { weddingId, eventId } = await context.params;
  return handleEvent(request, weddingId, eventId);
}
export const PATCH = GET;
export const DELETE = GET;
