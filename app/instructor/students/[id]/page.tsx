"use client";

import { useParams } from "next/navigation";
import { usePathname } from "next/navigation";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";

export default function StudentsProfilePage() {
  const pathname = usePathname();
  const params = useParams();
  const studentId = params.id;

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Students", href: "/instructor/students" }, { label: `${studentId}`, href: pathname }]} />
      <main className="flex flex-col min-h-screen bg-neutral-100 p-6 space-y-6">
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Student Profile</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Student ID: {studentId}
          </p>
        </div>
      </main>
    </>
  );
}