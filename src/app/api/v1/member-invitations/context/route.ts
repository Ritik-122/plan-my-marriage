import type { NextRequest } from "next/server";
import { handleTeam } from "@/modules/team/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handleTeam(request, { kind: "context" });
}
