import { PlatformTopNav } from "@/components/platform-admin/PlatformTopNav";


export default function PlatformAdminAcademiesPage() {
  return (
    <>
      <PlatformTopNav page="Academies" href="/platform-admin/academies" />
      <main className="flex-1 p-4 sm:p-6" />
    </>
  );
}
