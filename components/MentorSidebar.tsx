"use client";

import { Blocks } from "lucide-react";
import {
  DashboardSquare01,
  Video02,
  UserMultiple,
  Structure01,
  Message01,
  Notification02,
  Marketing,
  Settings01,
} from "@/assets/icons";
import {
  AppSidebar,
  type NavItem,
  type NavSectionConfig,
} from "@/components/AppSidebar";

const sections: NavSectionConfig[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/mentor/dashboard", icon: DashboardSquare01 },
      { title: "Live Sessions", href: "/mentor/live-sessions", icon: Video02 },
      { title: "My students", href: "/mentor/students", icon: UserMultiple },
      { title: "Curriculum", href: "/mentor/curriculum", icon: Structure01 },
      { title: "Announcements", href: "/mentor/announcements", icon: Marketing },
      { title: "Notifications", href: "/mentor/notifications", icon: Notification02 },
      { title: "Messages", href: "/mentor/messages", icon: Message01 },
    ],
  },
];

const accountItems: NavItem[] = [
  { title: "Settings", href: "/mentor/settings", icon: Settings01 },
  { title: "Integration", href: "/mentor/integration", icon: Blocks },
];

export function MentorSidebar() {
  return (
    <AppSidebar
      homeHref="/mentor/dashboard"
      sections={sections}
      accountItems={accountItems}
    />
  );
}
