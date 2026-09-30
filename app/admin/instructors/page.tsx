"use client";

import * as React from "react";
import { Users, Search, SlidersHorizontal, MoreHorizontal } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";
import { Badge } from "@/components/ui/badge";
import type { Instructor } from "./data";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = React.useState<Instructor[]>([]);

  function handleInvited(added: Omit<Instructor, "id">[]) {
    setInstructors((current) => [
      ...current,
      ...added.map((instructor) => ({
        ...instructor,
        id: `${instructor.email}-${Date.now()}-${Math.random()}`,
      })),
    ]);
  }

  const activeCount = instructors.filter((i) => i.status === "Active").length;
  const pendingCount = instructors.filter((i) => i.status === "Pending").length;

  return (
    <>
      <AdminTopNav breadcrumb={["People", "Instructors"]} />
      <main className="flex-1 p-8">
        {instructors.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Users className="h-12 w-12 text-neutral-300" />
            <p className="font-semibold text-neutral-900">
              No instructors yet.
            </p>
            <p className="max-w-80 text-sm text-neutral-500">
              Instructors will appear here once they&apos;ve been invited to
              your program.
            </p>
            <div className="mt-2">
              <InviteInstructorDialog onInvited={handleInvited} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Instructors
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Manage instructors across your program
                </p>
              </div>
              <InviteInstructorDialog onInvited={handleInvited} />
            </div>

            <div className="rounded-xl border border-neutral-300 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 p-5">
                <div>
                  <p className="font-semibold text-neutral-900">
                    {instructors.length} Instructor
                    {instructors.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {activeCount} Active · {pendingCount} Pending
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-neutral-400">
                    <Search className="h-4 w-4" />
                    <input
                      type="search"
                      placeholder="Search by name or email"
                      className="w-56 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex h-10 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                  </button>
                </div>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="text-xs tracking-wider text-neutral-500 uppercase">
                  <tr>
                    <th className="w-10 px-5 py-3">
                      <input type="checkbox" className="h-4 w-4 rounded" />
                    </th>
                    <th className="px-5 py-3">Instructor</th>
                    <th className="px-5 py-3">Track</th>
                    <th className="px-5 py-3">Cohort</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="w-12 px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map((instructor) => (
                    <tr
                      key={instructor.id}
                      className="border-t border-neutral-200"
                    >
                      <td className="px-5 py-4">
                        <input type="checkbox" className="h-4 w-4 rounded" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-500">
                            {initials(instructor.name)}
                          </span>
                          <div>
                            <p className="font-medium text-neutral-900">
                              {instructor.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {instructor.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-700">
                        {instructor.track}
                      </td>
                      <td className="px-5 py-4 text-neutral-700">
                        {instructor.cohort}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          status={
                            instructor.status === "Active"
                              ? "success"
                              : "warning"
                          }
                        >
                          {instructor.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-neutral-500">
                        {instructor.joined}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          aria-label="Row actions"
                          className="text-neutral-400 hover:text-neutral-700"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
