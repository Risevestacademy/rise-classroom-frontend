import { Metadata } from "next";

import { SettingsShell } from "@/components/settings/SettingsShell";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage how Rise Classroom works for your academy.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsShell>{children}</SettingsShell>;
}
