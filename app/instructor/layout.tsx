import { AuthGuard } from "@/components/AuthGuard";
import { InstructorNavProvider } from "@/components/instructor-dashboard/InstructorNavContext";
import { InstructorSidebar } from "@/components/instructor-dashboard/InstructorSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="INSTRUCTOR">
      <InstructorNavProvider>
      <div className="flex min-h-screen w-full">
        <InstructorSidebar />
          <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50">
            {children}
        </div>
      </div>
      </InstructorNavProvider>
    </AuthGuard>
  );
}