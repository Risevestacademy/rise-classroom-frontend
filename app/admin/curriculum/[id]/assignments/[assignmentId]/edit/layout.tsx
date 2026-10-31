import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Assignment",
};

export default function EditAssignmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
