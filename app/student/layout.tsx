import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentTopBar } from "@/components/StudentTopBar";
import { StudentNavProvider } from "@/components/StudentNavContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="STUDENT">
      <StudentNavProvider>
        <div className="flex min-h-screen w-full">
          <StudentSidebar />
          <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50">
            <StudentTopBar />
            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </StudentNavProvider>
    </AuthGuard>
  );
}
