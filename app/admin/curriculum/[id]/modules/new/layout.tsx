import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Module",
};

export default function NewModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
