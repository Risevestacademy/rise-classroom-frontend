import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Resource",
};

export default function NewResourceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
