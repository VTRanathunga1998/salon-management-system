import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
