import type { NextRequest } from "next/server";
import { handleTeam } from "@/modules/team/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const params = await context.params;
  return handleTeam(request, { kind: "members", weddingId: params.weddingId });
}
