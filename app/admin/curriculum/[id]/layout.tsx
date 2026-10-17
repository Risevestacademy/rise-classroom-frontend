import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curriculum Details",
};

export default function CurriculumDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
