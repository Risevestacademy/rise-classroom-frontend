"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

import { PeopleSelectionBar } from "@/components/PeopleSelectionBar";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Student } from "@/components/instructor-dashboard/data";

interface StudentsTableProps {
  students: Student[];
  variant?: "directory" | "track";
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyMessage?: string;
}

const statusClasses: Record<string, string> = {
  Active: "bg-emerald-100/80 text-emerald-700",
  Behind: "bg-amber-100/80 text-amber-800",
  "At risk": "bg-red-100/80 text-red-700",
};

function getProgressWidth(progress: Student["progress"]) {
  const value = Number(progress);

  if (!Number.isFinite(value)) return "0%";

  return `${Math.min(100, Math.max(0, value))}%`;
}

export function StudentsTable({
  students,
  onSelectionChange,
  emptyMessage = "No students to display.",
}: StudentsTableProps) {
  const router = useRouter();

  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  const selectedStudentIds = useMemo(
    () => selectedStudents.map((student) => student.id),
    [selectedStudents]
  );

  useEffect(() => {
    onSelectionChange?.(selectedStudentIds);
  }, [selectedStudentIds, onSelectionChange]);

  const allVisibleSelected =
    students.length > 0 &&
    students.every((student) =>
      selectedStudentIds.includes(student.id)
    );

  const toggleSelectRow = (student: Student) => {
    setSelectedStudents((current) => {
      const alreadySelected = current.some(
        (selected) => selected.id === student.id
      );

      if (alreadySelected) {
        return current.filter(
          (selected) => selected.id !== student.id
        );
      }

      return [...current, student];
    });
  };

  const toggleSelectAll = () => {
    setSelectedStudents((current) => {
      if (allVisibleSelected) {
        const visibleIds = new Set(
          students.map((student) => student.id)
        );

        return current.filter(
          (student) => !visibleIds.has(student.id)
        );
      }

      const currentById = new Map(
        current.map((student) => [student.id, student])
      );

      students.forEach((student) => {
        currentById.set(student.id, student);
      });

      return Array.from(currentById.values());
    });
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div
          className="min-w-[680px] overflow-hidden flex flex-col border-b border-neutral-200/80"
        >
          <div
            className="grid grid-cols-12 items-center border-b border-neutral-200 text-[14px] font-semibold text-neutral-500 bg-neutral-50/80 px-6 py-3.5"
          >
            <div className="col-span-4 flex items-center gap-3">
              <input
                type="checkbox"
                aria-label="Select all visible students"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-neutral-900"
              />

              <span>Student</span>
            </div>

            <div
              className="col-span-3" >
              Progress
            </div>

            <div
              className="col-span-3 text-center"
            >
              Average grade
            </div>

            <div
              className="col-span-1"
            >
              Status
            </div>

            <div className="col-span-1 flex justify-end">
              <MoreVertical className="h-4 w-4" />
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <p className="text-sm text-neutral-600">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              students.map((student) => {
                const isSelected = selectedStudentIds.includes(
                  student.id
                );

                return (
                  <div
                    key={student.id}
                    className="grid grid-cols-12 items-center border-b border-neutral-200 transition-colors hover:bg-neutral-50/60 px-6 py-4"
                  >
                    <div className="col-span-4 flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${student.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelectRow(student)}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-neutral-300 accent-neutral-900"
                      />

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold ml-1 text-sm ${student.avatarBg}`}
                      >
                        {student.initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-neutral-900">
                          {student.name}
                        </p>

                        <p className="truncate text-[14px] text-neutral-500">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex min-w-0 items-center gap-2 col-span-3 sm:gap-3"
                    >
                      <div
                        className="h-2 overflow-hidden rounded-full bg-neutral-100 w-full max-w-24 sm:max-w-28"
                      >
                        <div
                          className="h-full rounded-full bg-brand-primary"
                          style={{
                            width: getProgressWidth(
                              student.progress
                            ),
                          }}
                        />
                      </div>

                      <span className="shrink-0 text-[14px] font-medium text-neutral-600">
                        {student.progress}%
                      </span>
                    </div>

                    <div
                      className="col-span-3 text-center"
                    >
                      <span className="text-[14px] font-semibold text-neutral-900">
                        {student.averageGrade}
                      </span>
                    </div>

                    <div
                      className="col-span-1"
                    >
                      <Badge
                        variant="light"
                        className={`whitespace-nowrap rounded-full border-0 px-2.5 py-0.5 text-[12px] font-medium ${statusClasses[student.status] ??
                          "bg-neutral-100 text-neutral-700"
                          }`}
                      >
                        {student.status}
                      </Badge>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${student.name}`}
                          className="rounded-md p-1 text-neutral-600 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-300 cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="min-w-18 ring-0 rounded-xl border-none bg-white p-1 shadow-lg"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => router.push(`/instructor/students/${student.id}`)}
                              className="cursor-pointer text-xs font-medium text-neutral-700 rounded-lg px-3 py-2 hover:bg-neutral-100 focus:bg-neutral-100"
                            >
                              View
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Selection Toolbar */}
      <PeopleSelectionBar
        items={selectedStudents}
        noun={{ singular: "student", plural: "students" }}
        onClear={clearSelection}
        exportFileName="students"
        exportColumns={[
          { header: "Name", value: (student) => student.name },
          { header: "Email", value: (student) => student.email },
          { header: "Progress (%)", value: (student) => student.progress },
          { header: "Average Grade", value: (student) => student.averageGrade },
          { header: "Status", value: (student) => student.status },
        ]}
      />
    </>
  );
}

export default StudentsTable;
