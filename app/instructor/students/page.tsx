"use client";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { useState } from "react";
import { Search, Download, Filter } from "lucide-react";

import StudentsTable from "@/components/instructor-dashboard/StudentsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DUMMY_STUDENTS } from "@/components/instructor-dashboard/data";
import { ExportStudentsModal } from "@/components/instructor-dashboard/ExportStudentsModal";
import { FilterStudentsModal } from "@/components/instructor-dashboard/FilterStudentsModal";

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [isExportOpen, setIsExportOpen] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"name" | "progress" | "grade">("name");

  const filteredStudents = DUMMY_STUDENTS.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ? true :
        activeTab === "active" ? student.status === "Active" :
          activeTab === "behind" ? student.status === "Behind" :
            activeTab === "at-risk" ? student.status === "At risk" : true;

    const matchesModalFilter =
      statusFilter === "All" ? true : student.status === statusFilter;

    return matchesSearch && matchesTab && matchesModalFilter;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "progress") return b.progress - a.progress;
    if (sortBy === "grade") {
      return b.averageGrade - a.averageGrade;
    }
    return 0;
  });

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
              All {DUMMY_STUDENTS.length}
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "active"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              Active {DUMMY_STUDENTS.filter((s) => s.status === "Active").length}
            </button>
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
          />
        </div>

        <FilterStudentsModal
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          currentStatusFilter={statusFilter}
          currentSortBy={sortBy}
          onApplyFilters={(newStatus, newSort) => {
            setStatusFilter(newStatus);
            setSortBy(newSort);
          }}
        />

        <ExportStudentsModal
          isOpen={isExportOpen}
          onOpenChange={setIsExportOpen}
          allStudents={DUMMY_STUDENTS}
          filteredStudents={filteredStudents}
          selectedStudentIds={selectedStudentIds}
        />
      </main>
    </>
  );
}