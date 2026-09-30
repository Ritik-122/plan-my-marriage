import type { NextRequest } from "next/server";
import { handleWedding } from "@/modules/weddings/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ weddingId: string }> };
export async function GET(request: NextRequest, context: Context) {
  return handleWedding(request, (await context.params).weddingId);
}
export async function PATCH(request: NextRequest, context: Context) {
  return handleWedding(request, (await context.params).weddingId);
}
