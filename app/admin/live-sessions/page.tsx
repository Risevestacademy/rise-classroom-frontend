import { AdminTopNav } from "@/components/AdminTopNav";
import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";

export default function AdminLiveSessionsPage() {
  return (
    <LiveSessionsScreen
      joinPath="/admin/live"
      topNav={
        <AdminTopNav
          breadcrumb={[
            "Overview",
            { label: "Live sessions", href: "/admin/live-sessions" },
          ]}
        />
      }
    />
  );
}
