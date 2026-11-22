import type { Metadata } from "next";

import { MentorStudents } from "./MentorStudents";

export const metadata: Metadata = { title: "My students" };

export default function MentorStudentsPage() {
  return <MentorStudents />;
}
