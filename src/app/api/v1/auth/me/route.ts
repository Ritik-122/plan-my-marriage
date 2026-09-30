import type { NextRequest } from "next/server";
import { handleAuth } from "@/modules/auth/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  return handleAuth(request, "me");
}
