import type { NextRequest } from "next/server";
import { handleDashboard } from "@/modules/dashboard/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return handleDashboard(request, (await context.params).weddingId);
}
