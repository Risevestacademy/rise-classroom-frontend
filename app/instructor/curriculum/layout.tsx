import type { Metadata } from "next";

import { CurriculumScopeProvider } from "@/features/curriculum/scope";

export const metadata: Metadata = {
  title: "Curriculum",
};

export default function InstructorCurriculumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurriculumScopeProvider role="instructor">
      {children}
    </CurriculumScopeProvider>
  );
}
