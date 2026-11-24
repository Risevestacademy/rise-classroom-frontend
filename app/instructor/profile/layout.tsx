"use client";

import { IdCard } from "lucide-react";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import {
  SettingsShell,
  type ShellNavItem,
} from "@/components/settings/SettingsShell";

const navItems: ShellNavItem[] = [
  {
    key: "personal",
    title: "Personal profile",
    href: "/instructor/profile",
    icon: IdCard,
  },
];

export default function InstructorProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsShell
      title="Profiles"
      href="/instructor/profile"
      navItems={navItems}
      topNav={
        <InstructorNavbar
          breadcrumb={[
            "Overview",
            { label: "Profile", href: "/instructor/profile" },
          ]}
        />
      }
    >
      {children}
    </SettingsShell>
  );
}
