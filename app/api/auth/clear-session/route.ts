import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  (await cookies()).delete("session-id");
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
