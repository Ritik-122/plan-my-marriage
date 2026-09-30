import type { NextRequest } from "next/server";
import { handleAuth } from "@/modules/auth/http";
export const runtime = "nodejs";
export function POST(request: NextRequest) {
  return handleAuth(request, "login");
}
