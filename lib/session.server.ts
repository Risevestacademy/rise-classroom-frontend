import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { landingPathFor, type Role, type SessionResponse } from "@/lib/auth";
import { PATHNAME_HEADER } from "@/proxy";

/** Long enough for a warm backend; a cold start falls back to <AuthGuard>. */
const SESSION_TIMEOUT_MS = 5_000;

/**
 * The signed-in user's session, read from the backend with the request's own
 * cookies. `null` means signed out; a network failure or 5xx throws.
 */
export const getServerSession = cache(async () => {
  const cookie = (await headers()).get("cookie");
  if (!cookie) return null;

  try {
    return await api.get<SessionResponse | null>("/auth/get-session", {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(SESSION_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

/**
 * Keeps an area to one role before anything renders: signed-out users go to
 * sign-in, anyone else to their own landing page. Returns `null` when the
 * backend can't be reached, leaving the decision to <AuthGuard> in the browser
 * rather than signing people out over a slow server.
 */
export async function requireRole(role: Role) {
  let session: SessionResponse | null;
  try {
    session = await getServerSession();
  } catch {
    return null;
  }

  if (!session?.user) {
    const next = (await headers()).get(PATHNAME_HEADER);
    redirect(next ? `/sign-in?${new URLSearchParams({ next })}` : "/sign-in");
  }

  if (session.user.role !== role) redirect(landingPathFor(session.user));

  return session;
}
