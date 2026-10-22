import type { NextRequest } from "next/server";
import { handleWebsite } from "@/modules/website/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  return handleWebsite(request, (await context.params).weddingId, true);
}
