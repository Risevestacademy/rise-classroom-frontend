"use client";

import { useParams } from "next/navigation";

import ModuleForm from "@/components/instructor-dashboard/ModuleForm";

export default function CreateModulePage() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  return <ModuleForm mode="create" curriculumId={curriculumId} />;
}