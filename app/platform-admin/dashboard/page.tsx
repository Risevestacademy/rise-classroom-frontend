import { AppTopNav } from "@/components/AppTopNav";

// The dashboard is still being designed; this holds the route for it.
export default function PlatformAdminDashboardPage() {
  return (
    <>
      <AppTopNav
        basePath="/platform-admin"
        breadcrumb={[
          "Overview",
          { label: "Dashboard", href: "/platform-admin/dashboard" },
        ]}
      />
      <main className="flex-1 p-4 sm:p-6" />
    </>
  );
}
