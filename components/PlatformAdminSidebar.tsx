"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardSquare01, Mortarboard, UserChat, UserQuestion } from "@/assets/icons";
import { AppSidebar, type NavSectionConfig } from "@/components/AppSidebar";
import { platformQueries } from "@/lib/platform";

const requestsHref = "/platform-admin/onboarding-requests";

/* `newRequests` is the count shown beside Onboarding Requests. */
const sectionsWith = (newRequests: number): NavSectionConfig[] => [
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
        href: requestsHref,
        icon: UserQuestion,
        badge: newRequests || undefined,
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
  const { data: applications = [] } = useQuery(platformQueries.applications());
  const newRequests = applications.filter(
    ({ status }) => status === "NEW",
  ).length;

  return (
    <AppSidebar
      homeHref="/platform-admin/dashboard"
      sections={sectionsWith(newRequests)}
      showUserMenu={false}
    />
  );
}
