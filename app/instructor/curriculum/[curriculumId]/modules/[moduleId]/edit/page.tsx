"use client";

import { useParams } from "next/navigation";

import ModuleForm from "@/components/instructor-dashboard/ModuleForm";
import { useModuleInitialValues } from "@/lib/use-instructor-forms";

export default function EditModulePage() {
  const { curriculumId, moduleId } = useParams<{
    curriculumId: string;
    moduleId: string;
  }>();

  const { initialValues, isReady } = useModuleInitialValues(curriculumId, moduleId);

  if (!isReady || !initialValues) {
    return <div className="p-6 text-sm text-neutral-500">Loading module…</div>;
  }

  return (
    <ModuleForm
      key={moduleId}
      mode="edit"
      curriculumId={curriculumId}
      moduleId={moduleId}
      initialValues={initialValues}
    />
  );
}