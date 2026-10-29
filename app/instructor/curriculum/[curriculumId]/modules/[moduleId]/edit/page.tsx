"use client";

import { useParams, usePathname } from "next/navigation";

import ModuleForm from "@/components/instructor-dashboard/ModuleForm";
import { useModuleInitialValues } from "@/lib/use-instructor-forms";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";

import {
  instructorQueries,
} from "@/lib/instructor";
import { useQuery } from "@tanstack/react-query";

export default function EditModulePage() {
  const pathname = usePathname();
  const { curriculumId, moduleId } = useParams<{
    curriculumId: string;
    moduleId: string;
  }>();

  const curriculum = useQuery(
    instructorQueries.curriculumById({ curriculumId: curriculumId})
  );
  const currentCurriculum = curriculum.data;

  const { initialValues, isReady } = useModuleInitialValues(curriculumId, moduleId);

  if (!isReady || !initialValues) {
    return <div className="p-6 text-sm text-neutral-500">Loading module…</div>;
  }

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Curriculum", href: "/instructor/curriculum" }, { label: currentCurriculum?.title ?? ".....", href: `/instructor/curriculum/${curriculumId}`}, { label: "Edit Module", href: pathname }]} />
      <ModuleForm
        key={moduleId}
        mode="edit"
        curriculumId={curriculumId}
        moduleId={moduleId}
        initialValues={initialValues}
      />
    </>
  );
}