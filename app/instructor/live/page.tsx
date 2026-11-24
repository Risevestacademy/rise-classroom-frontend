import type { Metadata } from "next";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { LiveJoinPage } from "@/components/live-room/LivePages";

export const metadata: Metadata = { title: "Live sessions" };

export default function InstructorLivePage() {
  return <LiveJoinPage basePath="/instructor" topNav={<InstructorNavbar breadcrumb={["Overview", { label: "Live sessions", href: "/instructor/live" }]} />} />;
}
