import { NextRequest, NextResponse } from "next/server";

/**
 * Rewrite /@handle and /@handle/slug to /u/@handle and /u/@handle/slug.
 *
 * This keeps the public-facing URL as mado.blue/@handle while the actual
 * Next.js pages live under app/u/[handle]/ (avoiding the dynamic segment
 * at the root level which conflicts with Next.js type generation).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Match /@<handle> or /@<handle>/<slug>
  if (pathname.startsWith("/@")) {
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = `/u${pathname}`;
    return NextResponse.rewrite(rewritten);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/@:path*"],
};
