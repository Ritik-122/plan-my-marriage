import type { NextRequest } from "next/server";
import { handleExpense } from "@/modules/expenses/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; expenseId: string }> },
) {
  const { weddingId, expenseId } = await context.params;
  return handleExpense(request, weddingId, expenseId);
}
export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
