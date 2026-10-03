"use client";

import { CreateModulePage } from "@/components/instructor-dashboard/CreateModulePage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
// import { CreateLessonPage } from "@/components/instructor-dashboard/CreateLessonPage";
// import { CreateResourcePage } from "@/components/instructor-dashboard/CreateResourcePage";

function CreatePageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  return (
    <div className="flex flex-col bg-neutral-100 p-6 space-y-6">
      {type === "modules" && <CreateModulePage />}
      {/* {type === "lessons" && <CreateLessonPage />} */}
      {/* {type === "resources" && <CreateTrackForm />} */}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Loading form...</div>}>
      <CreatePageContent />
    </Suspense>
  );
}