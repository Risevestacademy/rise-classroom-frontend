"use client";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, Filter, MoreVertical } from "lucide-react";
import jsPDF from "jspdf";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DUMMY_STUDENTS } from "@/components/instructor-dashboard/data"

export default function StudentsPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "filter" | "selected">("all");
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");

  // Filter Modal State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"name" | "progress" | "grade">("name");

  // Student Profile Dialog State
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<"overview" | "progress" | "assignments" | "attendance" | "details">("overview");

  // Filtering & Sorting Logic
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
      return Number.parseFloat(b.averageGrade) - Number.parseFloat(a.averageGrade);
    }
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Perform CSV Export from modal settings
  const handlePerformExport = () => {
    let dataToExport = DUMMY_STUDENTS;

    if (exportScope === "filter") {
      dataToExport = filteredStudents;
    } else if (exportScope === "selected") {
      dataToExport = DUMMY_STUDENTS.filter((s) => selectedStudentIds.includes(s.id));
    }

    if (dataToExport.length === 0) {
      setIsExportOpen(false);
      return;
    }

    if (exportFormat === "csv") {
      const headers = ["Name", "Email", "Progress (%)", "Average Grade", "Status"];
      const rows = dataToExport.map((student) => [
        `"${student.name.replace(/"/g, '""')}"`,
        `"${student.email.replace(/"/g, '""')}"`,
        `"${student.progress}%"`,
        `"${student.averageGrade}%"`,
        `"${student.status}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // jsPDF Generation
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Student Progress Report", 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 27);

      let yPos = 38;
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos - 5, 182, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(50);
      doc.text("Name", 16, yPos);
      doc.text("Email", 70, yPos);
      doc.text("Progress", 130, yPos);
      doc.text("Grade", 155, yPos);
      doc.text("Status", 180, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");

      dataToExport.forEach((student, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(student.name, 16, yPos);
        doc.text(student.email, 70, yPos);
        doc.text(`${student.progress}%`, 130, yPos);
        doc.text(`${student.averageGrade}%`, 155, yPos);
        doc.text(student.status, 180, yPos);

        yPos += 8;
      });

      doc.save(`students_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    setIsExportOpen(false);
  };

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Students", href: "/instructor/students" }]} />
      <main className="flex flex-col min-h-screen bg-neutral-100 p-6 space-y-6">

        {/* Header Section */}
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
            variant="outline"
            onClick={() => setIsExportOpen(true)}
            className="bg-brand-primary text-white border-none rounded-xl px-4 py-2 text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full">

          {/* Tabs */}
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
              Active {DUMMY_STUDENTS.filter(s => s.status === "Active").length}
            </button>
            <button
              onClick={() => setActiveTab("behind")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "behind"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              Behind {DUMMY_STUDENTS.filter(s => s.status === "Behind").length}
            </button>
            <button
              onClick={() => setActiveTab("at-risk")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${activeTab === "at-risk"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
                }`}
            >
              At risk {DUMMY_STUDENTS.filter(s => s.status === "At risk").length}
            </button>
          </div>

          {/* Search & Filter Button */}
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
              variant="outline"
              className={`bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl px-4 py-2 h-10 text-xs font-medium flex items-center gap-2 shrink-0 shadow-xs cursor-pointer ${statusFilter !== "All" ? "border-brand-primary text-brand-primary font-semibold" : ""
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter {statusFilter !== "All" ? `(1)` : ""}</span>
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/80 overflow-hidden flex flex-col">

          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3.5 bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider items-center">
            <div className="col-span-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-neutral-300 accent-neutral-900 w-4 h-4 cursor-pointer"
              />
              <span className="ml-2">Student</span>
            </div>
            <div className="col-span-3">Progress</div>
            <div className="col-span-3 text-center">Average Grade</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">...</div>
          </div>

          {/* Table Body / Rows */}
          <div className="divide-y divide-neutral-100">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <p className="text-sm text-neutral-600 mb-3">
                  No students match "{searchQuery || "your filters"}".
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl px-4 py-2 h-10 text-xs font-medium shadow-xs cursor-pointer"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id);

                return (
                  <div key={student.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-neutral-50/50 transition-colors">

                    {/* Checkbox & Student Info */}
                    <div className="col-span-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(student.id)}
                        className="rounded border-neutral-300 accent-neutral-900 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex items-center gap-3 ml-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${student.avatarBg}`}>
                          {student.initials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-900">{student.name}</p>
                          <p className="text-[11px] text-neutral-500">{student.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage correctly separated */}
                    <div className="col-span-3 flex items-center gap-2 sm:gap-3">
                      <div className="w-full max-w-24 sm:max-w-28 bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-primary h-full rounded-full"
                          style={{ width: student.progress }}
                        />
                      </div>
                      <span className="hidden text-xs font-medium text-neutral-600 sm:inline">
                        {student.progress}%
                      </span>
                    </div>

                    {/* Average Grade */}
                    <div className="col-span-3 flex items-center justify-center">
                      <span className="text-xs font-bold text-neutral-900">
                        {student.averageGrade}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-1">
                      <Badge
                        variant="light"
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0 ${student.status === "Active"
                            ? "bg-emerald-100/80 text-emerald-700"
                            : student.status === "Behind"
                              ? "bg-amber-100/80 text-amber-800"
                              : "bg-red-100/80 text-red-700"
                          }`}
                      >
                        {student.status}
                      </Badge>
                    </div>

                    {/* Actions Dropdown */}
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="min-w-18! border-none ring-0 bg-white! cursor-pointer shadow-lg rounded-xl p-1"
                          align="end"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => {
                                setViewingStudent(student);
                                setStudentModalTab("overview");
                              }}
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

        {/* Student Profile Dialog Modal */}
        <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
          <DialogContent className="sm:max-w-[720px] p-6 rounded-3xl border-none bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {viewingStudent && (
              <div className="space-y-6">
                {/* Modal Header */}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-neutral-900">{viewingStudent.name}</h2>
                    <Badge
                      variant="light"
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0 ${viewingStudent.status === "Active"
                          ? "bg-emerald-100/80 text-emerald-700"
                          : viewingStudent.status === "Behind"
                            ? "bg-amber-100/80 text-amber-800"
                            : "bg-red-100/80 text-red-700"
                        }`}
                    >
                      {viewingStudent.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {viewingStudent.email} • Joined {viewingStudent.joinedDate}
                  </p>
                </div>

                {/* Reminder Banner for At-Risk students */}
                {viewingStudent.status === "At risk" && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 flex items-center justify-between">
                    <p className="text-xs text-neutral-700">
                      No activity for {viewingStudent.lastActive} and {viewingStudent.overdueCount} overdue assignments
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => console.log("Reminder sent to:", viewingStudent.email)}
                      className="rounded-xl text-xs h-8 px-3 border-neutral-300 shadow-xs cursor-pointer hover:bg-neutral-100 text-neutral-700 bg-white"
                    >
                      Send reminder
                    </Button>
                  </div>
                )}

                {/* Navigation Tabs */}
                <div className="bg-neutral-100 p-1 rounded-xl flex items-center gap-1 w-fit">
                  {(["overview", "progress", "assignments", "attendance", "details"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setStudentModalTab(tab)}
                      className={`capitalize rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${studentModalTab === tab
                          ? "bg-white text-neutral-900 shadow-xs font-semibold"
                          : "text-neutral-600 hover:text-neutral-900"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content: Overview */}
                {studentModalTab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
                      <div>
                        <p className="text-lg font-bold text-neutral-900">{viewingStudent.progress}%</p>
                        <p className="text-[11px] text-neutral-500">Progress</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-neutral-900">{viewingStudent.overdueCount}</p>
                        <p className="text-[11px] text-neutral-500">Overdue</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-neutral-900">{viewingStudent.averageGrade}%</p>
                        <p className="text-[11px] text-neutral-500">Avg grade</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-neutral-900">{viewingStudent.attendanceRate}</p>
                        <p className="text-[11px] text-neutral-500">Attendance</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Progress by module</h3>
                      <div className="space-y-2">
                        {viewingStudent.modules.map((mod: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-neutral-700 w-20 truncate">{mod.name}</span>
                            <div className="w-full flex-1 mx-4 bg-neutral-200/70 h-2 rounded-full overflow-hidden">
                              <div className="bg-brand-primary h-full rounded-full" style={{ width: `${mod.progress}%` }} />
                            </div>
                            <span className="font-semibold text-neutral-900 w-10 text-right">{mod.progress}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Recent Activity</h3>
                      <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden">
                        {viewingStudent.recentActivity.map((act: any, i: number) => (
                          <div key={i} className="p-3.5 flex items-center justify-between bg-white text-xs">
                            <div>
                              <p className="font-semibold text-neutral-900">{act.title}</p>
                              <p className="text-[11px] text-neutral-500">{act.detail}</p>
                            </div>
                            <span className="text-[11px] text-neutral-400">{act.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content: Progress */}
                {studentModalTab === "progress" && (
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-neutral-700">Detailed Module Breakdown</p>
                    <div className="space-y-3">
                      {viewingStudent.modules.map((mod: any, i: number) => (
                        <div key={i} className="p-4 border border-neutral-200 rounded-2xl bg-white space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-neutral-900">{mod.name}</span>
                            <span className="text-neutral-500">{mod.progress}% completed</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full rounded-full" style={{ width: `${mod.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: Assignments */}
                {studentModalTab === "assignments" && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-neutral-700">Assignment Submissions & Grades</p>
                    <div className="space-y-2">
                      {viewingStudent.assignmentsList.map((assign: any, i: number) => (
                        <div key={i} className="p-4 border border-neutral-200 rounded-2xl bg-white flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-neutral-900">{assign.title}</p>
                            <p className="text-neutral-500">{assign.module}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${assign.status === "Graded" ? "bg-emerald-100 text-emerald-800" :
                                assign.status === "Overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                              }`}>
                              {assign.status}
                            </span>
                            <span className="font-bold text-neutral-900">{assign.grade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: Attendance */}
                {studentModalTab === "attendance" && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-neutral-700">Live Session Attendance Record</p>
                    <div className="space-y-2">
                      {viewingStudent.attendanceList.map((att: any, i: number) => (
                        <div key={i} className="p-4 border border-neutral-200 rounded-2xl bg-white flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-neutral-900">{att.title}</p>
                            <p className="text-neutral-500">{att.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${att.status === "Attended" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                              }`}>
                              {att.status}
                            </span>
                            <span className="text-neutral-500">{att.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: Details */}
                {studentModalTab === "details" && (
                  <div className="space-y-4 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Email:</span>
                      <span className="font-medium text-neutral-900">{viewingStudent.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Cohort:</span>
                      <span className="font-medium text-neutral-900">{viewingStudent.cohort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Joined date:</span>
                      <span className="font-medium text-neutral-900">{viewingStudent.joinedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Last active:</span>
                      <span className="font-medium text-neutral-900">{viewingStudent.lastActive}</span>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <Button
                    variant="outline"
                    onClick={() => console.log("Export report for:", viewingStudent.name)}
                    className="rounded-xl text-xs h-10 px-4 border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs cursor-pointer bg-white"
                  >
                    Export report
                  </Button>
                  <Button
                    onClick={() => console.log("Open message dialog for:", viewingStudent.email)}
                    className="rounded-xl text-xs h-10 px-6 bg-neutral-950 text-white hover:bg-neutral-800 shadow-xs cursor-pointer"
                  >
                    Message
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Filter Modal Dialog */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-[420px] p-6 rounded-3xl border-none bg-white shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-neutral-900">
                Filter & Sort Students
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-800">
                  Filter by Status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["All", "Active", "Behind", "At risk"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${statusFilter === status
                          ? "bg-brand-primary text-white border-neutral-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-800">
                  Sort by
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "name", label: "Name" },
                    { id: "progress", label: "Progress" },
                    { id: "grade", label: "Grade" },
                  ].map((sort) => (
                    <button
                      key={sort.id}
                      onClick={() => setSortBy(sort.id as any)}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${sortBy === sort.id
                          ? "bg-brand-primary text-white border-neutral-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                        }`}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setStatusFilter("All");
                    setSortBy("name");
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                >
                  Reset filters
                </button>
                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="bg-brand-primary rounded-xl px-6 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Modal Dialog matching design */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border-none bg-white shadow-xl">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Export students
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Who Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-800">
                  Who
                </label>
                <div className="grid grid-cols-3 border border-neutral-300 rounded-xl overflow-hidden p-0.5 bg-white">
                  <button
                    onClick={() => setExportScope("all")}
                    className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${exportScope === "all"
                        ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                        : "text-neutral-600 hover:text-neutral-900"
                      }`}
                  >
                    All 24
                  </button>
                  <button
                    onClick={() => setExportScope("filter")}
                    className={`py-2 text-xs font-medium border-x border-neutral-200 transition-colors cursor-pointer ${exportScope === "filter"
                        ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                        : "text-neutral-600 hover:text-neutral-900"
                      }`}
                  >
                    Current filter
                  </button>
                  <button
                    onClick={() => setExportScope("selected")}
                    className={`py-2 text-xs font-medium transition-colors cursor-pointer ${exportScope === "selected"
                        ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                        : "text-neutral-600 hover:text-neutral-900"
                      }`}
                  >
                    Selected ({selectedStudentIds.length})
                  </button>
                </div>
              </div>

              {/* Format Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-800">
                  Format
                </label>
                <div className="grid grid-cols-2 border border-neutral-300 rounded-xl overflow-hidden p-0.5 bg-white">
                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${exportFormat === "csv"
                        ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                        : "text-neutral-600 hover:text-neutral-900"
                      }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setExportFormat("pdf")}
                    className={`py-2 text-xs font-medium border-l border-neutral-200 transition-colors cursor-pointer ${exportFormat === "pdf"
                        ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                        : "text-neutral-600 hover:text-neutral-900"
                      }`}
                  >
                    PDF report
                  </button>
                </div>
              </div>

              {/* Subtext */}
              <p className="text-xs text-neutral-500 leading-relaxed">
                Includes name, email, track, progress, grades, attendance and status.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsExportOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-xs font-medium border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePerformExport}
                  className=" bg-brand-primary rounded-xl px-6 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Export
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </>
  );
}