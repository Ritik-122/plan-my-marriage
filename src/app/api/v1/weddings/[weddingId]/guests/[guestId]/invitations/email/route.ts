import type { NextRequest } from "next/server";
import { handleGuestEmail } from "@/modules/invitations/email-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ weddingId: string; guestId: string }> };
export async function GET(request: NextRequest, context: Context) {
  return handleGuestEmail(request, await context.params);
}
export const POST = GET;
