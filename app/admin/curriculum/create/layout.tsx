import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Curriculum",
};

export default function CreateCurriculumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
