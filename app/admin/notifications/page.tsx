import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminTopNav } from "@/components/AdminTopNav";
import { AdminNotificationsScreen } from "@/components/notifications/AdminNotificationsScreen";

export const metadata: Metadata = { title: "Notifications" };

export default function AdminNotificationsPage() {
  return (
    <>
      <AdminTopNav
        breadcrumb={["Overview", { label: "Notifications", href: "/admin/notifications" }]}
      />
      <Suspense>
        <AdminNotificationsScreen />
      </Suspense>
    </>
  );
}
