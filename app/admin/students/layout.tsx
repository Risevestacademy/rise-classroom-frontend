import { StudentsProvider } from "./StudentsContext";

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentsProvider>{children}</StudentsProvider>;
}
