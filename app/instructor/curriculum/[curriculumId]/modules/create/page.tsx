"use client";

import { useParams, usePathname } from "next/navigation";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import ModuleForm from "@/components/instructor-dashboard/ModuleForm";
import {
  instructorQueries,
} from "@/lib/instructor";
import { useQuery } from "@tanstack/react-query";

export default function CreateModulePage() {
  const pathname = usePathname();
  const { curriculumId } = useParams<{ curriculumId: string }>();
   const curriculum = useQuery(
    instructorQueries.curriculumById({ curriculumId: curriculumId})
  );
  const currentCurriculum = curriculum.data;

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Curriculum", href: "/instructor/curriculum" }, { label: currentCurriculum?.title ?? ".....", href: `/instructor/curriculum/${curriculumId}`}, { label: "Add Module", href: pathname }]} />
      <ModuleForm mode="create" curriculumId={curriculumId} />
    </>
  )
}