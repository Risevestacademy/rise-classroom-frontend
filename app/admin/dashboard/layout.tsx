import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopNav } from "@/components/AdminTopNav";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col bg-neutral-50/50">
        <AdminTopNav />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
