import { AuthGuard } from "@/components/AuthGuard";
import { InstructorSidebar } from "@/components/instructor-dashboard/InstructorSidebar";
import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="INSTRUCTOR">
      <div className="flex h-screen w-full overflow-hidden">
        <InstructorSidebar />
        <main className="flex flex-1 flex-col h-full bg-neutral-100 min-w-0">
          <InstructorNavbar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}