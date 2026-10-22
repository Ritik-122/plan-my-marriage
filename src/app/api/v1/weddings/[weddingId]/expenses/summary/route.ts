import type { NextRequest } from "next/server";
import { handleExpense } from "@/modules/expenses/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string }> },
) {
  const { weddingId } = await context.params;
  return handleExpense(request, weddingId, undefined, true);
}
export const GET = handle;
