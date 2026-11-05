"use client";

import { DashboardSquare01, Mortarboard, UserChat, UserQuestion } from "@/assets/icons";
import { AppSidebar, type NavSectionConfig } from "@/components/AppSidebar";
import { onboardingRequests } from "@/lib/platform-sample-data";

const sections: NavSectionConfig[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/platform-admin/dashboard",
        icon: DashboardSquare01,
      },
      {
        title: "Onboarding Requests",
        href: "/platform-admin/onboarding-requests",
        icon: UserQuestion,
        badge: onboardingRequests.filter(({ status }) => status === "NEW").length,
      },
      {
        title: "Academies",
        href: "/platform-admin/academies",
        icon: Mortarboard,
      },
      {
        title: "Feedback",
        href: "/platform-admin/feedback",
        icon: UserChat,
      },
    ],
  },
];

export function PlatformAdminSidebar() {
  return (
    <AppSidebar
      homeHref="/platform-admin/dashboard"
      sections={sections}
      showUserMenu={false}
    />
  );
}
