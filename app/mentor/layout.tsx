import { Metadata } from "next";

import { RoleGate } from "@/components/RoleGate";
import { MentorSidebar } from "@/components/MentorSidebar";
import { SidebarNavProvider } from "@/components/SidebarNavContext";

export const metadata: Metadata = {
  title: "Mentor Dashboard",
  description: "The mentor dashboard for following your students' progress.",
};

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate role="MENTOR">
      <SidebarNavProvider>
        <div className="flex min-h-screen w-full">
          <MentorSidebar />
          <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50">
            {children}
          </div>
        </div>
      </SidebarNavProvider>
    </RoleGate>
  );
}
