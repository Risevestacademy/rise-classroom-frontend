import type { AdminUser } from "@/lib/admin";

type BadgeStatus = "success" | "warning" | "error";

export function getStudentStatus(user: AdminUser): {
  label: string;
  badge: BadgeStatus;
} {
  if (user.status === "SUSPENDED") {
    return { label: "Suspended", badge: "error" };
  }
  if (user.onboardingStatus === "INVITED") {
    return { label: "Pending", badge: "warning" };
  }
  return { label: "Active", badge: "success" };
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatJoined(user: AdminUser) {
  if (user.onboardingStatus === "INVITED") return "--";
  return formatDate(user.onboardedAt ?? user.createdAt);
}
