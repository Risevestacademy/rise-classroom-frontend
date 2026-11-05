import { AppTopNav } from "@/components/AppTopNav";

/* The top nav on every program admin page. The area has no calendar. */
export function PlatformTopNav({ page, href }: { page: string; href: string }) {
  return (
    <AppTopNav
      basePath="/platform-admin"
      breadcrumb={["Overview", { label: page, href }]}
      showCalendar={false}
    />
  );
}
