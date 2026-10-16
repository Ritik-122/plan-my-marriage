import type { NextRequest } from "next/server";
import { handleInvitation } from "@/modules/invitations/http";
export const runtime = "nodejs";
export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      weddingId: string;
      guestId: string;
      accessTokenId: string;
    }>;
  },
) {
  return handleInvitation(request, await context.params);
}
