import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Module",
};

export default function EditModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
