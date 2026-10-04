import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminNavProvider } from "@/components/AdminNavContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="SUPERADMIN">
      <AdminNavProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-0/50">
            {children}
          </div>
        </div>
      </AdminNavProvider>
    </AuthGuard>
  );
}
