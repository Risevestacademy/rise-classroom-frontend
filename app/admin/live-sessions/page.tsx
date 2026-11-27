import { AdminTopNav } from "@/components/AdminTopNav";
import { ScheduleLiveSessionButton } from "@/components/calendar/LiveSessionForm";
import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";

export default async function AdminLiveSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  return (
    <LiveSessionsScreen
      joinPath="/admin/live"
      action={<ScheduleLiveSessionButton />}
      canEdit
      openSessionId={session ?? null}
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
