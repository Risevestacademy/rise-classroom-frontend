import { AppTopNav } from "@/components/AppTopNav";
import { LiveSessionsScreen } from "@/components/LiveSessionsScreen";

export default function MentorLiveSessionsPage() {
  return (
    <LiveSessionsScreen
      joinPath="/mentor/live"
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
