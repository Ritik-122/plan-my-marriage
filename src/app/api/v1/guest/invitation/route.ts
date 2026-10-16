import type { NextRequest } from "next/server";
import { handleInvitation } from "@/modules/invitations/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return handleInvitation(request);
}
