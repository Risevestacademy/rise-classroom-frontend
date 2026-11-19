"use client";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { useState } from "react";
import { Search, Download, Filter } from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";

import StudentsTable from "@/components/instructor-dashboard/StudentsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ExportStudentsModal } from "@/components/instructor-dashboard/ExportStudentsModal";
import { FilterStudentsModal } from "@/components/instructor-dashboard/FilterStudentsModal";
import {
  instructorQueries,
  toInstructorStudentListItems,
} from "@/lib/instructor";

export default function StudentsPage() {
  const tracksQuery = useQuery(instructorQueries.myTracks());
  const tracks = tracksQuery.data ?? [];
  const studentQueries = useQueries({
    queries: tracks.map((track) =>
      instructorQueries.students({
        cohortId: track.cohortId,
        trackId: track.trackId,
      }),
    ),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [isExportOpen, setIsExportOpen] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const allStudents = toInstructorStudentListItems(
    studentQueries.flatMap((query) => query.data ?? []),
  );
  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && student.status === "Active") ||
      (activeTab === "inactive" && student.status === "Inactive");

    const matchesModalFilter =
      statusFilter === "All" ? true : student.status === statusFilter;

    return matchesSearch && matchesTab && matchesModalFilter;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const errorMessage =
    tracksQuery.isError || studentQueries.some((query) => query.isError)
      ? "Unable to load students. Please try again."
      : undefined;
  const isLoading =
    tracksQuery.isLoading || studentQueries.some((query) => query.isLoading);

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Students", href: "/instructor/students" }]} />
      <main className="flex flex-col min-h-screen bg-neutral-100 p-6 space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              Students
            </h1>
            <p className="text-sm font-normal text-neutral-500 mt-0.5">
              Manage students across your track
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => setIsExportOpen(true)}
            className="bg-brand-primary hover:bg-neutral-800 text-white border-none rounded-xl px-4 py-2 text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full bg-white p-4 mb-0 rounded-t-2xl border border-neutral-100 shadow-xs">
          <div className="bg-neutral-200/70 p-1 rounded-xl flex items-center gap-1 w-fit shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "all"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              All {allStudents.length}
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "active"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              Active {allStudents.filter((student) => student.status === "Active").length}
            </button>
            {/* listStudents does not provide progress-based student statuses.
            <button
              onClick={() => setActiveTab("behind")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "behind"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              Behind {DUMMY_STUDENTS.filter((s) => s.status === "Behind").length}
            </button>
            <button
              onClick={() => setActiveTab("at-risk")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "at-risk"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              At risk {DUMMY_STUDENTS.filter((s) => s.status === "At risk").length}
            </button>
            */}
            <button
              onClick={() => setActiveTab("inactive")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "inactive"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              Inactive {allStudents.filter((student) => student.status === "Inactive").length}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72 bg-white rounded-xl border-neutral-200 shadow-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 w-full"
                leadingIcon={null}
              />
            </div>
            <Button
              onClick={() => setIsFilterOpen(true)}
              variant="secondary"
              className={`bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl px-4 py-2 h-10 text-xs font-medium flex items-center gap-2 shrink-0 shadow-xs cursor-pointer ${statusFilter !== "All"
                  ? "border-brand-primary text-brand-primary font-semibold"
                  : ""
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter {statusFilter !== "All" ? `(1)` : ""}</span>
            </Button>
          </div>
        </div>

        <div className="border-b border-neutral-200/80 overflow-hidden flex flex-col">
          <StudentsTable
            students={filteredStudents}
            onSelectionChange={setSelectedStudentIds}
            emptyMessage={`No students match "${searchQuery || "your filters"}".`}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>

        <FilterStudentsModal
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          currentStatusFilter={statusFilter}
          onApplyFilters={(newStatus) => {
            setStatusFilter(newStatus);
          }}
        />

        <ExportStudentsModal
          isOpen={isExportOpen}
          onOpenChange={setIsExportOpen}
          allStudents={allStudents}
          filteredStudents={filteredStudents}
          selectedStudentIds={selectedStudentIds}
        />
      </main>
    </>
  );
}