import { Metadata } from "next";
import { cookies } from "next/headers";
import { HydrationBoundary } from "@tanstack/react-query";

import { AdminSidebar } from "@/components/AdminSidebar";
import { RoleGate } from "@/components/RoleGate";
import { SidebarNavProvider } from "@/components/SidebarNavContext";
import { adminQueries } from "@/lib/admin";
import { dehydrateServerQueries, prefetch } from "@/lib/query.server";
import { SelectedCohortProvider } from "@/lib/selected-cohort";
import { SELECTED_COHORT_COOKIE } from "@/lib/selected-cohort-pick";
import { getServerSession } from "@/lib/session.server";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "The admin dashboard for managing the Rise Classroom.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every admin page's top nav has the cohort picker, so the cohorts load
  // here, alongside the session <RoleGate> checks.
  const [cookieStore] = await Promise.all([
    cookies(),
    prefetch(adminQueries.cohorts()),
    getServerSession().catch(() => null),
  ]);

  return (
    <RoleGate role="SUPERADMIN">
      <HydrationBoundary state={dehydrateServerQueries()}>
        <SelectedCohortProvider
          initialId={cookieStore.get(SELECTED_COHORT_COOKIE)?.value ?? ""}
        >
          <SidebarNavProvider>
            <div className="flex min-h-screen w-full">
              <AdminSidebar />
              <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50">
                {children}
              </div>
            </div>
          </SidebarNavProvider>
        </SelectedCohortProvider>
      </HydrationBoundary>
    </RoleGate>
  );
}
