import type { NextRequest } from "next/server";
import { handleTask } from "@/modules/tasks/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: NextRequest,
  context: { params: Promise<{ weddingId: string; taskId: string }> },
) {
  const { weddingId, taskId } = await context.params;
  return handleTask(request, weddingId, taskId);
}
export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
