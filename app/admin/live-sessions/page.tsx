import { AdminTopNav } from "@/components/AdminTopNav";
import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";

export default function AdminLiveSessionsPage() {
  return (
    <LiveSessionsScreen
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
