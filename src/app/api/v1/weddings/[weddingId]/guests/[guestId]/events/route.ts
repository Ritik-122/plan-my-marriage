import type { NextRequest } from "next/server";
import { handleGuest } from "@/modules/guests/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ weddingId: string; guestId: string }> };
export async function GET(request: NextRequest, context: Context) {
  return handleGuest(request, { ...(await context.params), guestEvents: true });
}
