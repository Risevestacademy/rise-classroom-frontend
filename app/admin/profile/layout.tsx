import { Metadata } from "next";

import { ProfileShell } from "@/components/profile/ProfileShell";

export const metadata: Metadata = {
  title: "Profiles",
  description: "Your academy's profile and your own.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileShell>{children}</ProfileShell>;
}
