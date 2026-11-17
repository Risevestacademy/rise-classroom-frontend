import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminTopNav } from "@/components/AdminTopNav";
import { AnnouncementsScreen } from "@/components/announcements/AnnouncementsScreen";

export const metadata: Metadata = { title: "Announcements" };

export default function AdminAnnouncementsPage() {
  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "Overview",
          { label: "Announcements", href: "/admin/announcements" },
        ]}
      />
      <Suspense>
        <AnnouncementsScreen />
      </Suspense>
    </>
  );
}
