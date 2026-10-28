"use client";

import { useParams, usePathname } from "next/navigation";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import ModuleForm from "@/components/instructor-dashboard/ModuleForm";

export default function CreateModulePage() {
  const pathname = usePathname();
  const { curriculumId } = useParams<{ curriculumId: string }>();

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Curriculum", href: "/instructor/curriculum" }, { label: "Add Module", href: pathname }]} />
      <ModuleForm mode="create" curriculumId={curriculumId} />
    </>
  )
}