import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminNavProvider } from "@/components/AdminNavContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminNavProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-neutral-50/50">
          {children}
        </div>
      </div>
    </AdminNavProvider>
  );
}
