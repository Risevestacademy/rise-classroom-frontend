import { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";

import { PlatformAdminSidebar } from "@/components/PlatformAdminSidebar";
import { RoleGate } from "@/components/RoleGate";
import { SidebarNavProvider } from "@/components/SidebarNavContext";
import { platformQueries } from "@/lib/platform";
import { dehydrateServerQueries, prefetch } from "@/lib/query.server";

export const metadata: Metadata = {
  title: "Platform Admin Dashboard",
  description: "The platform admin dashboard for managing Rise Classroom.",
};

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* The sidebar's badge reads the applications. They must be in the cache
     before it renders: a page's <HydrationBoundary> only fills a query the
     sidebar already created after hydration, so the server and the browser
     would render that page differently. */
  await prefetch(platformQueries.applications());

  return (
    <RoleGate role="PLATFORM_ADMIN">
      <HydrationBoundary state={dehydrateServerQueries()}>
        <SidebarNavProvider>
          <div className="flex min-h-screen w-full">
            <PlatformAdminSidebar />
            <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50">
              {children}
            </div>
          </div>
        </SidebarNavProvider>
      </HydrationBoundary>
    </RoleGate>
  );
}
