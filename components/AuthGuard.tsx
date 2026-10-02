"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { landingPathFor, type Role } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";

/**
 * Keeps an area to one role. Renders straight away (the proxy has already seen
 * a session cookie, and the page shows its own skeletons), then sends the user
 * elsewhere once the session comes back missing or for a different role.
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
