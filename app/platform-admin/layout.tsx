import { Metadata } from "next";

import { PlatformAdminSidebar } from "@/components/PlatformAdminSidebar";
import { RoleGate } from "@/components/RoleGate";
import { SidebarNavProvider } from "@/components/SidebarNavContext";

export const metadata: Metadata = {
  title: "Platform Admin Dashboard",
  description: "The platform admin dashboard for managing Rise Classroom.",
};

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate role="PLATFORM_ADMIN">
      <SidebarNavProvider>
        <div className="flex min-h-screen w-full">
          <PlatformAdminSidebar />
          <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50">
            {children}
          </div>
        </div>
      </SidebarNavProvider>
    </RoleGate>
  );
}
