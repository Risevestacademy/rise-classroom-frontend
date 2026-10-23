"use client";

import { Users } from "lucide-react";

import { AdminPeopleTable } from "@/components/AdminPeopleTable";
import { AdminTopNav } from "@/components/AdminTopNav";
import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";

export default function InstructorsPage() {
  return (
    <>
      <AdminTopNav breadcrumb={["People", "Instructors"]} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <AdminPeopleTable
          role="INSTRUCTOR"
          title="Instructors"
          description="Manage instructors across your program"
          action={<InviteInstructorDialog />}
          label={{ singular: "instructor", plural: "instructors" }}
          personHeader="Instructor"
          emptyState={
            <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
              <Users className="h-12 w-12 text-neutral-200" />
              <p className="font-semibold text-neutral-800">
                No instructors yet.
              </p>
              <p className="max-w-80 text-sm text-neutral-400">
                Instructors will appear here once they&apos;ve been invited to
                your program.
              </p>
              <div className="mt-2">
                <InviteInstructorDialog />
              </div>
            </div>
          }
        />
      </main>
    </>
  );
}
