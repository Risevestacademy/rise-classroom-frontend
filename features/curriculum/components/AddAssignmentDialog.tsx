"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AssignmentBriefFields,
  AssignmentSettingsFields,
  assignmentFieldsFrom,
  emptyAssignmentValues,
  isAssignmentReady,
} from "@/features/curriculum/components/AssignmentFields";
import { emptyAssignment } from "@/features/curriculum/mappers";
import type { ModuleAssignment } from "@/features/curriculum/types";

const thisModule = "this-module";

/**
 * Adds an assignment to the module being created or edited. It's saved with
 * the module, so the module is the only choice here.
 */
export function AddAssignmentDialog({
  open,
  onOpenChange,
  moduleLabel,
  subtitle,
  lessonCount,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Module 3 - Introduction to Design". */
  moduleLabel: string;
  /** The curriculum's track and cohort. */
  subtitle: string;
  lessonCount: number;
  onAdd: (assignment: ModuleAssignment) => void;
}) {
  const [values, setValues] = React.useState({
    ...emptyAssignmentValues,
    moduleId: thisModule,
  });

  function change(changes: Partial<typeof values>) {
    setValues((current) => ({ ...current, ...changes }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        // Each time it opens, it starts from a blank assignment.
        if (!next) setValues({ ...emptyAssignmentValues, moduleId: thisModule });
      }}
    >
      <DialogContent className="w-[1040px] max-h-[90vh] bg-neutral-50">
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
          <DialogDescription className="text-neutral-500">
            Create a new assignment for this curriculum.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="font-bold text-neutral-800">Basic Information</h3>
              <div className="mt-5">
                <AssignmentBriefFields values={values} onChange={change} />
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <DialogClose
                render={
                  <Button
                    variant="secondary"
                    size="lg"
                    className="border-neutral-200 text-neutral-800"
                  />
                }
              >
                Cancel
              </DialogClose>
              <Button
                size="lg"
                disabled={!isAssignmentReady(values)}
                onClick={() => {
                  onAdd({
                    ...emptyAssignment(),
                    ...assignmentFieldsFrom(values),
                  });
                  onOpenChange(false);
                  setValues({ ...emptyAssignmentValues, moduleId: thisModule });
                }}
              >
                Create Assignment
              </Button>
            </div>
          </div>

          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="text-lg font-bold text-neutral-800">
              Assignment Settings
            </h3>
            <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
            <div className="mt-5">
              <AssignmentSettingsFields
                values={values}
                onChange={change}
                moduleOptions={[{ value: thisModule, label: moduleLabel }]}
                lessonCount={lessonCount}
              />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
