"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Search, Filter, MoreHorizontal } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { InviteStudentDialog } from "@/components/InviteStudentDialog";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { statusBadge } from "./data";
import { useStudents } from "./StudentsContext";

export default function StudentsPage() {
  const router = useRouter();
  const { students, addStudents } = useStudents();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term),
    );
  }, [students, query]);

  const activeCount = students.filter(
    (student) => student.status === "Active",
  ).length;
  const pendingCount = students.filter(
    (student) => student.status === "Pending",
  ).length;

  const allSelected =
    filtered.length > 0 &&
    filtered.every((student) => selected.has(student.id));
  const someSelected = filtered.some((student) => selected.has(student.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      for (const student of filtered) {
        if (allSelected) {
          next.delete(student.id);
        } else {
          next.add(student.id);
        }
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <AdminTopNav breadcrumb={["People", "Students"]} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {students.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Users className="h-14 w-14 text-primary-500" strokeWidth={1.5} />
            <p className="text-xl font-semibold text-neutral-900">
              No students yet
            </p>
            <p className="max-w-80 text-sm text-neutral-500">
              Students will appear here once they&apos;ve been invited to your
              program
            </p>
            <div className="mt-2">
              <InviteStudentDialog onInvited={addStudents} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Students
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Manage students across your program
                </p>
              </div>
              <InviteStudentDialog onInvited={addStudents} />
            </div>

            <div className="rounded-xl border border-neutral-300 bg-white">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-neutral-900">
                    {students.length} student{students.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {activeCount} Active · {pendingCount} Pending
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-neutral-400 sm:flex-none">
                    <Search className="h-4 w-4 shrink-0" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name or email"
                      className="w-full min-w-0 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-500"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-neutral-200 text-xs tracking-wider text-neutral-700 uppercase">
                    <tr>
                      <th className="w-12 px-5 py-3">
                        <Checkbox
                          aria-label="Select all students"
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Track</th>
                      <th className="px-5 py-3 font-medium">Cohort</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="w-12 px-5 py-3">
                        <MoreHorizontal className="h-4 w-4" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student) => (
                      <tr
                        key={student.id}
                        onClick={() =>
                          router.push(`/admin/students/${student.id}`)
                        }
                        className="cursor-pointer border-t border-neutral-200 hover:bg-neutral-100"
                      >
                        <td
                          className="px-5 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            aria-label={`Select ${student.name}`}
                            checked={selected.has(student.id)}
                            onCheckedChange={() => toggleOne(student.id)}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              name={student.name}
                              className="h-11 w-11 text-sm"
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/students/${student.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-neutral-900 hover:underline"
                              >
                                {student.name}
                              </Link>
                              <p className="text-neutral-500">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {student.track}
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {student.cohort}
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={statusBadge[student.status]}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {student.joined}
                        </td>
                        <td
                          className="px-5 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label="Row actions"
                            className="text-neutral-500 hover:text-neutral-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <p className="border-t border-neutral-200 px-5 py-10 text-center text-sm text-neutral-500">
                    No students match &quot;{query}&quot;.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
