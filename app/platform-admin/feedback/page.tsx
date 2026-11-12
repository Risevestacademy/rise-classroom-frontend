import { PlatformTopNav } from "@/components/platform-admin/PlatformTopNav";

export default function PlatformAdminFeedbackPage() {
  return (
    <>
      <PlatformTopNav page="Feedback" href="/platform-admin/feedback" />
      <main className="flex-1 p-4 sm:p-6" />
    </>
  );
}
