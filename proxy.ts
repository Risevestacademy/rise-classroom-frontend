import { NextResponse, type NextRequest } from "next/server";

// better-auth adds the `__Secure-` prefix when it runs behind HTTPS.
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

/** Layouts aren't given the URL, so it's passed on for the sign-in redirect. */
export const PATHNAME_HEADER = "x-pathname";

/**
 * Optimistic gate for the signed-in areas: with no session cookie at all,
 * there's no point rendering a dashboard, so go straight to sign-in and come
 * back afterwards. Whether the session is actually valid — and the right role —
 * is checked by <RoleGate> in each area's layout, and enforced by the API.
 */
export function proxy(request: NextRequest) {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) {
    const headers = new Headers(request.headers);
    headers.set(PATHNAME_HEADER, path);
    return NextResponse.next({ request: { headers } });
  }

  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", path);

  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/mentor/:path*",
    "/student/:path*",
  ],
};
