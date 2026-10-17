import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curriculum",
};

export default function CurriculumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
