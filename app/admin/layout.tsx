import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col bg-neutral-50/50">
        {children}
      </div>
    </div>
  );
}
