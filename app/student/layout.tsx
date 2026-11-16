import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentTopBar } from "@/components/StudentTopBar";
import { StudentNavProvider } from "@/components/StudentNavContext";
import { RoleGate } from "@/components/RoleGate";
import { CompanionProvider } from "@/components/mascot/Companion";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate role="STUDENT">
      <CompanionProvider>
        <StudentNavProvider>
          <div className="flex min-h-screen w-full">
            <StudentSidebar />
            <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50">
              <StudentTopBar />
              <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
          </div>
        </StudentNavProvider>
      </CompanionProvider>
    </RoleGate>
  );
}
