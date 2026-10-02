import { NextResponse, type NextRequest } from "next/server";

// better-auth adds the `__Secure-` prefix when it runs behind HTTPS.
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

/**
 * Optimistic gate for the signed-in areas: with no session cookie at all,
 * there's no point rendering a dashboard, so go straight to sign-in and come
 * back afterwards. Whether the session is actually valid — and the right role —
 * is checked client-side by <AuthGuard>, and enforced by the API itself.
 */
export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/admin/:path*", "/instructor/:path*"],
};
