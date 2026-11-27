import type { Metadata } from "next";

import { AppTopNav } from "@/components/AppTopNav";
import { LiveJoinPage } from "@/components/live-room/LivePages";

export const metadata: Metadata = { title: "Live sessions" };

export default function MentorLivePage() {
  return <LiveJoinPage basePath="/mentor" topNav={<AppTopNav basePath="/mentor" breadcrumb={["Overview", { label: "Live sessions", href: "/mentor/live-sessions" }]} />} />;
}
