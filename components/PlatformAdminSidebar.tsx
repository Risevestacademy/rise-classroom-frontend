"use client";

import { DashboardSquare01 } from "@/assets/icons";
import { AppSidebar, type NavSectionConfig } from "@/components/AppSidebar";

const sections: NavSectionConfig[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/platform-admin/dashboard",
        icon: DashboardSquare01,
      },
    ],
  },
];

export function PlatformAdminSidebar() {
  return (
    <AppSidebar homeHref="/platform-admin/dashboard" sections={sections} />
  );
}
