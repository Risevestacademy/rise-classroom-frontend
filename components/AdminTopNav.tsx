"use client";

import * as React from "react";

import { AdminCohortSelect } from "@/components/AdminCohortSelect";
import { AdminNotificationsPanel } from "@/components/AdminNotificationsPanel";
import { AppTopNav, type Crumb } from "@/components/AppTopNav";
import { useAdminNotifications } from "@/lib/admin-notifications";

export function AdminTopNav({
  breadcrumb = ["Overview", { label: "Dashboard", href: "/admin/dashboard" }],
}: {
  breadcrumb?: Crumb[];
}) {
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const { unreadCount } = useAdminNotifications();

  return (
    <AppTopNav
      basePath="/admin"
      breadcrumb={breadcrumb}
      filters={
        <div data-tour="cohort-select">
          <AdminCohortSelect />
        </div>
      }
      unreadCount={unreadCount}
      notificationsOpen={notificationsOpen}
      onNotificationsClick={() => setNotificationsOpen(true)}
    >
      <AdminNotificationsPanel
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
    </AppTopNav>
  );
}
