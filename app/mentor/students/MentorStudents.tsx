"use client";

import { Menu } from "@base-ui/react/menu";
import { useQuery } from "@tanstack/react-query";

import { AppTopNav } from "@/components/AppTopNav";
import { actionsMenuItemClass } from "@/components/MentorActionsMenu";
import { StudentsRoster } from "@/components/StudentsRoster";
import { myMenteesQuery, toMyAssignedStudent } from "@/lib/mentors";

/** The signed-in mentor's mentees. */
export function MentorStudents() {
  const mentees = useQuery(myMenteesQuery());
  const students = (mentees.data ?? []).map(toMyAssignedStudent);

  return (
    <>
      <AppTopNav
        basePath="/mentor"
        breadcrumb={["Overview", { label: "Students", href: "/mentor/students" }]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <h1 className="mb-6 text-2xl leading-8 font-semibold text-text-primary">My students</h1>
        <StudentsRoster
          students={students}
          loading={mentees.isPending}
          emptyMessage={
            mentees.error ? `Couldn't load your students. ${mentees.error.message}` : "No students assigned yet."
          }
          // PENDING-BACKEND: mentors can't read their students' progress yet.
          attention="--"
          exportFileName="My students"
          // The design has no mentor view of a student's profile yet.
          actions={(student) => (
            <Menu.LinkItem render={<a href={`mailto:${student.email}`} />} className={actionsMenuItemClass}>
              Email student
            </Menu.LinkItem>
          )}
        />
      </main>
    </>
  );
}
