import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has("session-id");

  // Root path: always redirect somewhere, never render directly
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSessionCookie ? "/invoice" : "/sign-in", request.url),
    );
  }

  const isPublic = pathname === "/sign-in";

  if (!isPublic && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isPublic && hasSessionCookie) {
    return NextResponse.redirect(new URL("/invoice", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
