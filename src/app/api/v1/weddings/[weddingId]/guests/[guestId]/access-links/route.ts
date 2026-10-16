import type { NextRequest } from "next/server";
import { handleInvitation } from "@/modules/invitations/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ weddingId: string; guestId: string }> };
export async function GET(request: NextRequest, context: Context) {
  return handleInvitation(request, await context.params);
}
export async function POST(request: NextRequest, context: Context) {
  return handleInvitation(request, await context.params);
}
