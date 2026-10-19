import type { NextRequest } from "next/server";
import { handleTeam } from "@/modules/team/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; invitationId: string }> },
) {
  const params = await context.params;
  return handleTeam(request, {
    kind: "invitations",
    weddingId: params.weddingId,
    id: params.invitationId,
  });
}
