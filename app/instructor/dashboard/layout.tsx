import { Sidebar } from "@/components/InstructorSidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="INSTRUCTOR">
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 min-h-screen p-8 bg-neutral-50/50">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
