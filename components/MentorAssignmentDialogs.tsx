"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { Search01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LockedField } from "@/components/ui/locked-field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { adminQueries, type AdminUser } from "@/lib/admin";
import {
  assignMentor,
  getAssignMentorErrorMessage,
  mentorQueries,
} from "@/lib/mentors";

type Person = { id: string; name: string; email: string };

const titleClass = "text-lg/6 font-semibold text-text-primary";
const descriptionClass = "font-work text-sm text-text-secondary";

function PersonCard({ person }: { person: Person }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl bg-surface-subtle p-3">
      <PersonAvatar name={person.name} colorKey={person.id} size={40} />
      <div className="min-w-0">
        <p className="truncate text-base font-medium text-text-primary">
          {person.name}
        </p>
        <p className="truncate font-work text-sm text-text-secondary">
          {person.email}
        </p>
      </div>
    </div>
  );
}

export function AssignStudentsDialog({
  mentor,
  open,
  onOpenChange,
}: {
  mentor: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[620px]">
        {open && <AssignStudentsForm mentor={mentor} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function AssignStudentsForm({
  mentor,
  onOpenChange,
}: {
  mentor: AdminUser;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Mentors can only take students from a cohort and track they're on.
  const scopes = (mentor.instructorTrack ?? []).flatMap((assignment) =>
    assignment.cohort?.id && assignment.track?.id
      ? [{ cohortId: assignment.cohort.id, trackId: assignment.track.id }]
      : [],
  );
  const lists = useQueries({
    queries: scopes.map((scope) =>
      adminQueries.users({ role: "STUDENT", ...scope, limit: 100 }),
    ),
  });
  const isPending = lists.some((list) => list.isPending);
  const isError = lists.some((list) => list.isError);
  const students = [
    ...new Map(
      lists
        .flatMap((list) => list.data?.items ?? [])
        .map((user) => [user.id, user]),
    ).values(),
  ];

  const query = search.trim().toLowerCase();
  const rows = students.filter(
    (student) =>
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query),
  );

  const assign = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((studentUserId) =>
          assignMentor({ mentorId: mentor.id, studentUserId }),
        ),
      );
      const assigned = ids.filter((_, i) => results[i].status === "fulfilled");
      const failure = results.find((result) => result.status === "rejected");
      return { assigned, error: failure?.reason as unknown };
    },
    onSuccess: ({ assigned, error }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      if (!error) {
        onOpenChange(false);
        return;
      }
      setSelected((current) => {
        const next = new Set(current);
        assigned.forEach((id) => next.delete(id));
        return next;
      });
    },
  });

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const outcome = assign.data;

  return (
    <div className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className={titleClass}>Assign student</DialogTitle>
        <DialogDescription className={descriptionClass}>
          Select students to add to this mentor
        </DialogDescription>
      </DialogHeader>

      <PersonCard
        person={{
          id: mentor.id,
          name: mentor.displayName ?? mentor.name,
          email: mentor.email,
        }}
      />

      <div className="flex flex-col gap-6">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-border-default p-2.5 text-text-muted">
          <Search01 className="size-4 shrink-0" />
          <span className="sr-only">Search students by name or email</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students by name or email"
            className="w-full min-w-0 bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </label>
        <p className="text-sm font-medium text-black">
          {selected.size} {selected.size === 1 ? "student" : "students"} selected
        </p>
      </div>

      <ul className="-my-3 flex max-h-80 flex-col gap-3 overflow-y-auto">
        {scopes.length === 0 ? (
          <EmptyRow>
            This mentor isn&apos;t on a cohort and track yet, so there&apos;s no
            one to assign.
          </EmptyRow>
        ) : isPending ? (
          Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="py-3">
              <Skeleton className="h-11 w-full" />
            </li>
          ))
        ) : isError ? (
          <EmptyRow>We couldn&apos;t load students. Please try again.</EmptyRow>
        ) : rows.length === 0 ? (
          <EmptyRow>
            {students.length === 0
              ? "There are no students in this mentor's cohort and track."
              : "No students match your search."}
          </EmptyRow>
        ) : (
          rows.map((student) => {
            const name = student.displayName ?? student.name;
            return (
              <li key={student.id}>
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={selected.has(student.id)}
                    onCheckedChange={(checked) => toggle(student.id, checked)}
                    className="size-4 border-icon-secondary"
                  />
                  <span className="flex min-w-0 items-center gap-3 p-3">
                    <PersonAvatar name={name} colorKey={student.id} size={40} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-work text-sm font-medium tracking-[-0.01em] text-text-primary">
                        {name}
                      </span>
                      <span className="truncate font-work text-sm text-text-secondary">
                        {student.email}
                      </span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>

      {outcome?.error !== undefined && (
        <p role="alert" className="font-work text-sm text-text-error">
          {outcome.assigned.length > 0 &&
            `Assigned ${outcome.assigned.length}, but not the rest. `}
          {getAssignMentorErrorMessage(outcome.error)}
        </p>
      )}

      <DialogFooter className="mt-0 gap-4 sm:justify-end">
        <Button variant="secondary" size="lg" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={selected.size === 0 || assign.isPending}
          onClick={() => assign.mutate([...selected])}
        >
          {assign.isPending
            ? "Assigning…"
            : selected.size > 1
              ? "Assign students"
              : "Assign student"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="py-6 text-center font-work text-sm text-text-muted">
      {children}
    </li>
  );
}

export function ReassignStudentDialog({
  student,
  currentMentor,
  open,
  onOpenChange,
  onReassign,
}: {
  student: Person;
  currentMentor: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReassign: (mentorId: string) => Promise<unknown>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[583px]">
        {open && (
          <ReassignStudentForm
            student={student}
            currentMentor={currentMentor}
            onOpenChange={onOpenChange}
            onReassign={onReassign}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReassignStudentForm({
  student,
  currentMentor,
  onOpenChange,
  onReassign,
}: {
  student: Person;
  currentMentor: { id: string; name: string };
  onOpenChange: (open: boolean) => void;
  onReassign: (mentorId: string) => Promise<unknown>;
}) {
  const mentors = useQuery(mentorQueries.list());
  const [mentorId, setMentorId] = React.useState("");
  // PENDING-BACKEND: the assign endpoint has no field for the reason yet.
  const [reason, setReason] = React.useState("");

  const options = (mentors.data ?? [])
    .filter((mentor) => mentor.id !== currentMentor.id)
    .map((mentor) => ({ value: mentor.id, label: mentor.name }));

  const reassign = useMutation({
    mutationFn: (id: string) => onReassign(id),
    onSuccess: () => onOpenChange(false),
  });

  return (
    <div className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className={titleClass}>Reassign student</DialogTitle>
        <DialogDescription className={descriptionClass}>
          Change the mentor assigned to this student. They will be moved to new
          mentor&apos;s list immediately.
        </DialogDescription>
      </DialogHeader>

      <PersonCard person={student} />

      <LockedField label="Current mentor" value={currentMentor.name} />

      <Select
        label="New mentor"
        required
        placeholder={mentors.isPending ? "Loading mentors…" : "Select a mentor"}
        value={mentorId}
        onChange={setMentorId}
        options={options}
      />

      <Field.Root className="flex flex-col gap-1">
        <Label>Reason for reassignment</Label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g student request"
        />
      </Field.Root>

      {reassign.isError && (
        <p role="alert" className="font-work text-sm text-text-error">
          {getAssignMentorErrorMessage(reassign.error)}
        </p>
      )}

      <DialogFooter className="mt-0 gap-4 sm:justify-end">
        <Button variant="secondary" size="lg" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!mentorId || reassign.isPending}
          onClick={() => reassign.mutate(mentorId)}
        >
          {reassign.isPending ? "Reassigning…" : "Reassign student"}
        </Button>
      </DialogFooter>
    </div>
  );
}
