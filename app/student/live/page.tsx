import type { Metadata } from "next";

import { LiveJoinPage } from "@/components/live-room/LivePages";

export const metadata: Metadata = { title: "Live sessions" };

export default function StudentLivePage() {
  return <LiveJoinPage basePath="/student" />;
}
