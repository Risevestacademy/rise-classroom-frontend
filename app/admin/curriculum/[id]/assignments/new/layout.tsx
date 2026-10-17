import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Assignment",
};

export default function NewAssignmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
