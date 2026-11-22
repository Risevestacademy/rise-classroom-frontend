"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  ServerErrorScreen,
  serviceFailure,
  ServiceErrorScreen,
  SignInRequiredScreen,
} from "@/components/ServerErrorScreen";
import { landingPathFor, type Role } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";

/**
 * Browser half of <RoleGate>. The server has usually checked the role already
 * and seeded the session, so this mostly catches sessions that expire or are
 * signed out mid-visit — and covers for the server when the backend was too
 * slow to answer.
 *
 * This is about where people land, not security — the API refuses the data to
 * anyone without the right session either way.
 */
export function AuthGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending, error, refetch } = useQuery(sessionQuery());
  // Whether they were signed in when the page opened, so losing the session
  // mid-visit can be told apart from never having one.
  const [hadSession] = React.useState(() => Boolean(session?.user));

  const user = session?.user;
  // The backend being down or slow isn't the same as being signed out.
  const failure = isPending ? null : serviceFailure(error);
  const signedOut = !isPending && !failure && !user;
  const wrongRole = Boolean(user && user.role !== role);

  React.useEffect(() => {
    // Arriving without a session goes straight to sign-in; losing it mid-visit
    // shows the "You need to sign in" screen instead.
    if (signedOut && !hadSession) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    } else if (user && wrongRole) {
      router.replace(landingPathFor(user));
    }
  }, [signedOut, hadSession, wrongRole, user, pathname, router]);

  if (failure === 503 || failure === 504) {
    return <ServiceErrorScreen status={failure} onRetry={() => refetch()} />;
  }
  if (failure === 500) return <ServerErrorScreen />;
  if (signedOut) return hadSession ? <SignInRequiredScreen next={pathname} /> : null;
  if (wrongRole) return null;

  return <>{children}</>;
}
