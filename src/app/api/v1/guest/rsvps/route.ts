import type { NextRequest } from "next/server";
import { handleInvitation } from "@/modules/invitations/http";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest) {
  return handleInvitation(request);
}
