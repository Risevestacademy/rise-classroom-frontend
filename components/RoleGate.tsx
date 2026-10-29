import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { AuthGuard } from "@/components/AuthGuard";
import type { Role } from "@/lib/auth";
import { requireRole } from "@/lib/session.server";
import { sessionQuery } from "@/lib/session-query";

/**
 * Checks the role on the server, then hands the session to the browser so the
 * nav and menus have the user straight away. <AuthGuard> stays as the backstop
 * for sessions that expire or are signed out mid-visit.
 */
export async function RoleGate({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const session = await requireRole(role);

  const queryClient = new QueryClient();
  if (session) queryClient.setQueryData(sessionQuery().queryKey, session);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuthGuard role={role}>{children}</AuthGuard>
    </HydrationBoundary>
  );
}
