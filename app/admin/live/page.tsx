import type { Metadata } from "next";

import { AdminTopNav } from "@/components/AdminTopNav";
import { LiveJoinPage } from "@/components/live-room/LivePages";

export const metadata: Metadata = { title: "Live sessions" };

export default function AdminLivePage() {
  return <LiveJoinPage basePath="/admin" topNav={<AdminTopNav breadcrumb={["Overview", { label: "Live sessions", href: "/admin/live-sessions" }]} />} />;
}
