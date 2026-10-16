import type { NextRequest } from "next/server";
import { handleEvent } from "@/modules/events/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ weddingId: string }> };
export async function GET(request: NextRequest, context: Context) {
  return handleEvent(request, (await context.params).weddingId);
}
export const POST = GET;
