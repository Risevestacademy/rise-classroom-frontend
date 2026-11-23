import { AdminTopNav } from "@/components/AdminTopNav";
import { ScheduleLiveSessionButton } from "@/components/calendar/LiveSessionForm";
import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";

export default function AdminLiveSessionsPage() {
  return (
    <LiveSessionsScreen
      joinPath="/admin/live"
      action={<ScheduleLiveSessionButton />}
      canEdit
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
