"use client";

import { Users } from "lucide-react";

import { AdminPeopleTable } from "@/components/AdminPeopleTable";
import { AdminTopNav } from "@/components/AdminTopNav";
import { InviteStudentDialog } from "@/components/InviteStudentDialog";

export default function StudentsPage() {
  return (
    <>
      <AdminTopNav breadcrumb={["People", "Students"]} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <AdminPeopleTable
          role="STUDENT"
          title="Students"
          description="Manage students across your program"
          action={<InviteStudentDialog />}
          label={{ singular: "student", plural: "students" }}
          personHeader="Student"
          rowHref={(student) => `/admin/students/${student.id}`}
          emptyState={
            <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
              <Users
                className="h-14 w-14 text-brand-primary"
                strokeWidth={1.5}
              />
              <p className="text-xl font-semibold text-neutral-800">
                No students yet
              </p>
              <p className="max-w-80 text-sm text-neutral-400">
                Students will appear here once they&apos;ve been invited to
                your program
              </p>
              <div className="mt-2">
                <InviteStudentDialog />
              </div>
            </div>
          }
        />
      </main>
    </>
  );
}
