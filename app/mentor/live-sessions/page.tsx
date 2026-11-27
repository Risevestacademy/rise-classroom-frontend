import { AppTopNav } from "@/components/AppTopNav";
import { ScheduleLiveSessionButton } from "@/components/calendar/LiveSessionForm";
import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";

export default function MentorLiveSessionsPage() {
  return (
    <LiveSessionsScreen
      joinPath="/mentor/live"
      action={<ScheduleLiveSessionButton />}
      canEdit="own"
      topNav={
        <AppTopNav
          basePath="/mentor"
          breadcrumb={[
            "Overview",
            { label: "Live sessions", href: "/mentor/live-sessions" },
          ]}
        />
      }
    />
  );
}
