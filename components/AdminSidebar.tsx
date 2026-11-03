"use client";

import {
  DashboardSquare01,
  Video02,
  UserMultiple,
  Teacher,
  Mentor,
  Admin,
  Cohorts,
  Track,
  Structure01,
  Activity02,
  Coins01,
  Message01,
  Notification02,
  Marketing,
} from "@/assets/icons";
import { AppSidebar, type NavSectionConfig } from "@/components/AppSidebar";

const sections: NavSectionConfig[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: DashboardSquare01 },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Live Sessions", href: "/admin/live-sessions", icon: Video02 },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Students", href: "/admin/students", icon: UserMultiple },
      { title: "Instructors", href: "/admin/instructors", icon: Teacher },
      { title: "Mentors", href: "/admin/mentors", icon: Mentor },
      { title: "Admins", href: "/admin/admins", icon: Admin },
    ],
  },
  {
    label: "Academy",
    items: [
      { title: "Cohorts", href: "/admin/cohorts", icon: Cohorts },
      { title: "Tracks", href: "/admin/tracks", icon: Track },
      { title: "Curriculum", href: "/admin/curriculum", icon: Structure01 },
    ],
  },
  {
    label: "Insight",
    items: [
      { title: "Reports", href: "/admin/reports", icon: Coins01 },
      { title: "Activity Log", href: "/admin/activity-log", icon: Activity02 },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Announcements", href: "/admin/announcements", icon: Marketing },
      { title: "Notifications", href: "/admin/notifications", icon: Notification02 },
      { title: "Messages", href: "/admin/messages", icon: Message01 },
    ],
  },
];

export function AdminSidebar() {
  return (
    <AppSidebar
      homeHref="/admin/dashboard"
      sections={sections}
    />
  );
}
