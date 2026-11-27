"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InstructorStudentListItem } from "@/lib/instructor";

interface ExportStudentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allStudents: InstructorStudentListItem[];
  filteredStudents: InstructorStudentListItem[];
  selectedStudentIds: string[];
}

export function ExportStudentsModal({
  isOpen,
  onOpenChange,
  allStudents,
  filteredStudents,
  selectedStudentIds,
}: ExportStudentsModalProps) {
  const [exportScope, setExportScope] = useState<"all" | "filter" | "selected">("all");
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");

  const handlePerformExport = () => {
    let dataToExport = allStudents;

    if (exportScope === "filter") {
      dataToExport = filteredStudents;
    } else if (exportScope === "selected") {
      dataToExport = allStudents.filter((s) => selectedStudentIds.includes(s.id));
    }

    if (dataToExport.length === 0) {
      onOpenChange(false);
      return;
    }

    if (exportFormat === "csv") {
      const headers = ["Name", "Email", "Status"];
      const rows = dataToExport.map((student) => [
        `"${student.name.replace(/"/g, '""')}"`,
        `"${student.email.replace(/"/g, '""')}"`,
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
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Students Report", 14, 20);

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
      /*
      doc.text("Progress", 130, yPos);
      doc.text("Grade", 155, yPos);
      */
      doc.text("Status", 140, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");

      dataToExport.forEach((student) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(student.name, 16, yPos);
        doc.text(student.email, 70, yPos);
        /*
        doc.text(`${student.progress}%`, 130, yPos);
        doc.text(`${student.averageGrade}%`, 155, yPos);
        */
        doc.text(student.status, 140, yPos);

        yPos += 8;
      });

      doc.save(`students_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border-none bg-white shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-xl font-bold text-neutral-900">
            Export students
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-800">
              Who
            </label>
            <div className="grid grid-cols-3 border border-neutral-300 rounded-xl overflow-hidden p-0.5 bg-white">
              <button
                onClick={() => setExportScope("all")}
                className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  exportScope === "all"
                    ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                All {allStudents.length}
              </button>
              <button
                onClick={() => setExportScope("filter")}
                className={`py-2 text-xs font-medium border-x border-neutral-200 transition-colors cursor-pointer ${
                  exportScope === "filter"
                    ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Current filter
              </button>
              <button
                onClick={() => setExportScope("selected")}
                className={`py-2 text-xs font-medium transition-colors cursor-pointer ${
                  exportScope === "selected"
                    ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Selected ({selectedStudentIds.length})
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-800">
              Format
            </label>
            <div className="grid grid-cols-2 border border-neutral-300 rounded-xl overflow-hidden p-0.5 bg-white">
              <button
                onClick={() => setExportFormat("csv")}
                className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  exportFormat === "csv"
                    ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                CSV
              </button>
              <button
                onClick={() => setExportFormat("pdf")}
                className={`py-2 text-xs font-medium border-l border-neutral-200 transition-colors cursor-pointer ${
                  exportFormat === "pdf"
                    ? "bg-indigo-100/80 text-indigo-950 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                PDF report
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Includes name, email and status.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-medium border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePerformExport}
              className="bg-brand-primary rounded-xl px-6 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 shadow-xs cursor-pointer"
            >
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}