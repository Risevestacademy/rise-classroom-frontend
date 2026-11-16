"use client";

import { Building2, IdCard } from "lucide-react";

import { SettingsShell, type ShellNavItem } from "@/components/settings/SettingsShell";
import { profileBasePath, profileRoutes } from "@/lib/profile";

const navItems: ShellNavItem[] = [
  { key: "academy", title: "Academy profile", href: profileRoutes.academy, icon: Building2 },
  { key: "personal", title: "Personal profile", href: profileRoutes.personal, icon: IdCard },
];

export function ProfileShell({ children }: { children: React.ReactNode }) {
  return (
    <SettingsShell title="Profiles" href={profileBasePath} navItems={navItems}>
      {children}
    </SettingsShell>
  );
}
