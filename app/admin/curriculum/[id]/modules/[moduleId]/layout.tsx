import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Module Details",
};

export default function ModuleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
