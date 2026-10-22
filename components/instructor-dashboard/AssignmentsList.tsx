"use client";

import { MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { submissionsData, type AssignmentItem } from "@/components/instructor-dashboard/data";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface AssignmentsListProps {
  assignments: AssignmentItem[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function AssignmentsList({
  assignments,
  searchQuery,
  onSearchQueryChange,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
}: AssignmentsListProps) {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [submissionSelectedIds, setSubmissionSelectedIds] = useState<string[]>([]);

  const mockSubmissions = submissionsData;

  const isAllSubmissionsSelected =
    mockSubmissions.length > 0 &&
    submissionSelectedIds.length === mockSubmissions.length;

  const handleSelectAllSubmissions = () => {
    if (isAllSubmissionsSelected) {
      setSubmissionSelectedIds([]);
    } else {
      setSubmissionSelectedIds(mockSubmissions.map((item) => item.id));
    }
  };

  const handleSelectSubmissionRow = (id: string) => {
    setSubmissionSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 max-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Assignments
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Manage all assignments in this curriculum
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative h-[35px] w-[220px] rounded-xl border border-neutral-200 bg-white sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search assignments.."
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="h-full w-full rounded-xl bg-transparent pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-1"
            />
          </div>

          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-200">
            <TableRow className="border-b border-neutral-200 hover:bg-transparent">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={
                    assignments.length > 0 &&
                    selectedIds.length === assignments.length
                  }
                  onCheckedChange={onToggleSelectAll}
                  className="rounded border-neutral-300"
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Assignment
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Module
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Due
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Submissions
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Status
              </TableHead>
              <TableHead className="w-16 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {assignments.map((assignment) => {
              const isSelected = selectedIds.includes(assignment.id);

              return (
                <TableRow
                  key={assignment.id}
                  className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 ${isSelected ? "bg-neutral-50/80" : ""
                    }`}
                >
                  <TableCell className="pl-4 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelectRow(assignment.id)}
                      className="rounded border-neutral-300"
                    />
                  </TableCell>

                  <TableCell className="py-4">
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">
                        {assignment.title}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {assignment.type}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-700">
                        {assignment.moduleNumber}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {assignment.moduleTitle}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-700">
                        {assignment.dueDate}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {assignment.dueRelative}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 text-xs font-medium text-neutral-700">
                    {assignment.submissions.completed}/
                    {assignment.submissions.total}
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge
                      variant="light"
                      className={
                        assignment.status === "Published"
                          ? "bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0"
                          : "bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0"
                      }
                    >
                      {assignment.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="w-16 py-4 pr-6">
                    <div className="flex w-full justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="min-w-18! border-none ring-0 bg-white! cursor-pointer"
                          align="end"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => setIsViewModalOpen(true)}
                              className="cursor-pointer"
                            >View</DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-[80%] !max-w-none h-[80%] !bottom-4 !right-4 !left-auto !top-auto !translate-x-0 !translate-y-0">
          <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="bg-neutral-200 px-2 py-1 !h-auto rounded-lg gap-1 inline-flex shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)]">
              <TabsTrigger
                value="overview"
                className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="submissions"
                className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
              >
                Submissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="outline-none tracking-wide">
              <DialogHeader>
                <DialogTitle>Introduction to Design Exercise</DialogTitle>
                <DialogDescription>
                  Project . Individual
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row pt-4 gap-3">
                <Card className="w-[70%] bg-white border-neutral-200 ring-1 ring-neutral-300 shadow-lg rounded-2xl p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-[18px] font-semibold">
                      Assignment Brief
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5 text-[14px]">
                    <div className="space-y-1">
                      <p className="font-medium">Assignment title</p>
                      <p className="font-regular">Visual Hierarchy</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">Description</p>
                      <p className="font-regular">Redesign a simple landing page using hierarchy and contrast</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">Instruction for students</p>
                      <p className="font-regular">Use typography, spacing, and color to guide the viewer through the page.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <p className="font-regular">Supporting resources</p>

                    </div>
                  </CardContent>
                </Card>
                <Card className="w-[30%] bg-white border-neutral-200 ring-1 ring-neutral-300 shadow-lg rounded-2xl p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-[18px] font-semibold">
                      Assignment details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Type:</span>
                      <span className="text-neutral-900 font-semibold">Project</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Submission type:</span>
                      <span className="text-neutral-900 font-semibold">File Upload</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Due date:</span>
                      <div className="text-right">
                        <p className="text-neutral-900 font-semibold">Oct 12, 2025</p>
                        <p className="text-neutral-500 text-[11px]">11:59 PM</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Relative to lesson:</span>
                      <span className="text-neutral-900 font-semibold">After lesson 4</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-neutral-500 font-medium">Status:</span>
                      <Badge
                        variant="light"
                        status="success"
                        className="bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-medium border-0"
                      >
                        Published
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="submissions" className="space-y-4 outline-none">
              <div className="w-full bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-50/80">
                    <TableRow className="border-b border-neutral-200/80 hover:bg-transparent">
                      <TableHead className="w-12 text-center pl-4 pr-0">
                        <Checkbox
                          checked={isAllSubmissionsSelected}
                          onCheckedChange={handleSelectAllSubmissions}
                          aria-label="Select all submissions"
                          className="rounded border-neutral-300"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Student
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Date Submitted
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5">
                        Grade
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500 py-3.5 text-right pr-6">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {mockSubmissions.map((submission) => {
                      const isSelected = submissionSelectedIds.includes(submission.id);

                      return (
                        <TableRow
                          key={submission.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                        >
                          <TableCell className="w-12 text-center pl-4 pr-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectSubmissionRow(submission.id)}
                              aria-label={`Select ${submission.name}`}
                              className="rounded border-neutral-300"
                            />
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-neutral-900">
                                  {submission.name}
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  {submission.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-neutral-800">
                                {submission.dateSubmitted}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {submission.timeSubmitted}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            {submission.status === "Submitted" ? (
                              <Badge
                                variant="light"
                                status="success"
                                className="bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0 shadow-none"
                              >
                                Submitted
                              </Badge>
                            ) : (
                              <Badge
                                variant="light"
                                status="error"
                                className="bg-rose-100/80 text-rose-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0 shadow-none"
                              >
                                Not submitted
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="py-3.5 text-xs font-medium text-neutral-600">
                            {submission.grade}
                          </TableCell>
                          <TableCell className="w-16 py-4 pr-6">
                            <div className="flex w-full justify-end">
                            <MoreHorizontal className="h-4 w-4" />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

        </DialogContent>
      </Dialog>
    </div>
  );
}
