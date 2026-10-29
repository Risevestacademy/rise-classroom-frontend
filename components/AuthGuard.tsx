"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

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
  const { data: session, isPending, isError } = useQuery(sessionQuery());

  const user = session?.user;
  const signedOut = !isPending && (isError || !user);
  const wrongRole = Boolean(user && user.role !== role);

  React.useEffect(() => {
    if (signedOut) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    } else if (user && wrongRole) {
      router.replace(landingPathFor(user));
    }
  }, [signedOut, wrongRole, user, pathname, router]);

  if (signedOut || wrongRole) return null;

  return <>{children}</>;
}
