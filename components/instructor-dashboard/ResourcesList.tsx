"use client";

import { MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ResourceRecord } from "@/lib/instructor";

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
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { useDeleteItem } from "@/lib/use-instructor-forms";

export type ResourceRow = ResourceRecord & {
  name: string;
  moduleNumber: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonNumber: number;
  uploaded: string;
  // fileType?: string;
  // fileSizeLabel?: string;
};

interface ResourcesListProps {
  resources: ResourceRow[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function ResourcesList({
  resources,
  searchQuery,
  onSearchQueryChange,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
}: ResourcesListProps) {
  const [viewing, setViewing] = useState<ResourceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentRow | null>(null);
    const deleteMutation = useDeleteItem("resource");

  return (
    <div className="space-y-6 max-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Resources
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Manage all resources in this curriculum
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative h-[35px] w-[220px] rounded-xl border border-neutral-200 bg-white sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search resources.."
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
                    resources.length > 0 &&
                    selectedIds.length === resources.length
                  }
                  onCheckedChange={onToggleSelectAll}
                  className="rounded border-neutral-300"
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Name
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Module
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Uploaded
              </TableHead>
              {/* <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Type & Size
              </TableHead> */}
              <TableHead className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                Status
              </TableHead>
              <TableHead className="w-16 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {resources.map((resource) => {
              const isSelected = selectedIds.includes(resource.id);

              return (
                <TableRow
                  key={resource.id}
                  className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 ${isSelected ? "bg-neutral-50/80" : ""
                    }`}
                >
                  <TableCell className="pl-4 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelectRow(resource.id)}
                      className="rounded border-neutral-300"
                    />
                  </TableCell>

                  <TableCell className="py-4">
                    <p className="text-xs font-semibold text-neutral-900">
                      {resource.name}
                    </p>
                  </TableCell>

                  <TableCell className="py-4">
                    <p className="text-xs font-medium text-neutral-700">
                      {resource.moduleNumber}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {resource.moduleTitle}
                    </p>
                  </TableCell>

                  <TableCell className="py-4">
                    <p className="text-xs font-medium text-neutral-700">
                      {resource.uploaded}
                    </p>
                  </TableCell>

                  {/* <TableCell className="py-4">
                    <p className="text-xs font-medium text-neutral-700">
                      {resource?.fileType}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {resource?.fileSizeLabel}
                    </p>
                  </TableCell> */}

                  <TableCell className="py-4">
                    <Badge
                      variant="light"
                      className="bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0"
                    >
                      Published
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
                              onClick={() => setViewing(resource)}
                              className="cursor-pointer"
                            >
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(resource)}
                              className="cursor-pointer text-error-text"
                            >
                              Delete
                            </DropdownMenuItem>
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

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="w-[80%] !max-w-none h-[80%] !bottom-4 !right-4 !left-auto !top-auto !translate-x-0 !translate-y-0">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>
              Attached to {viewing?.moduleNumber} · Lesson {viewing?.lessonNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row pt-4 gap-3">
            <Card className="w-[70%] bg-white border-neutral-200 ring-1 ring-neutral-300 shadow-lg rounded-2xl p-4">
              <CardHeader className="p-0">
                <CardTitle className="text-[18px] font-semibold">
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-5 text-[14px]">
                <div className="space-y-1 w-[700px] h-[300px] rounded-lg bg-amber-100">
                </div>
                <div className="flex justify-end gap-3 w-full sm:w-auto mt-4">
                  <Button type="button" variant="secondary" className="flex-1 sm:flex-none border-neutral-300 rounded-lg px-5 py-4 text-sm font-medium">
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="w-[30%] h-full bg-white border-neutral-200 ring-1 ring-neutral-300 shadow-lg rounded-2xl p-4">
              <CardHeader className="p-0">
                <CardTitle className="text-[18px] font-semibold">
                  Resource details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                {/* <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Type:</span>
                  <span className="text-neutral-900 font-semibold">
                    {viewing?.fileType}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Size:</span>
                  <span className="text-neutral-900 font-semibold">
                    {viewing?.fileSizeLabel}
                  </span>
                </div> */}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Date uploaded:</span>
                  <div className="text-right">
                    <p className="text-neutral-900 font-semibold">
                      {viewing?.uploaded}
                    </p>
                  </div>
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
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.title ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
      />
    </div>
  );
}