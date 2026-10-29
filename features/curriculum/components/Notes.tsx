"use client";

import * as React from "react";
import Image from "next/image";
import { Field } from "@base-ui/react/field";
import { Menu } from "@base-ui/react/menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, NotepadText, Pin, Plus, X } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurriculumScope } from "@/features/curriculum/scope";
import { formatDate } from "@/features/curriculum/mappers";
import type {
  CurriculumNote,
  SaveNoteInput,
} from "@/features/curriculum/types";

const menuItemClass =
  "flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100";

export function AddNoteButton({
  onClick,
  label = "Add Note",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button size="lg" onClick={onClick}>
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function NotesTab({
  curriculumId,
  onAddNote,
  onEditNote,
}: {
  curriculumId: string;
  onAddNote: () => void;
  onEditNote: (noteId: string) => void;
}) {
  const { api } = useCurriculumScope();
  const queryClient = useQueryClient();
  const notesQuery = useQuery(api.queries.notes(curriculumId));
  const modulesQuery = useQuery(api.queries.modules(curriculumId));
  const [deleteTarget, setDeleteTarget] = React.useState<CurriculumNote | null>(
    null,
  );

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: api.keys.notes(curriculumId),
    });

  const pinMutation = useMutation({
    mutationFn: (note: CurriculumNote) =>
      api.updateNote(curriculumId, note.id, { pinned: !note.pinned }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => api.deleteNote(curriculumId, noteId),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const notes = notesQuery.data ?? [];
  const modules = modulesQuery.data ?? [];

  if (notesQuery.isSuccess && notes.length === 0) {
    return (
      <EmptyState
        icon={NotepadText}
        title="No note yet"
        description="Add your first note. All notes are only visible only to admins and assigned instructors."
        action={<AddNoteButton onClick={onAddNote} label="Add note" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-800">Notes</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Internal notes about this curriculum.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          {notes.map((note) => {
            const modulePosition =
              modules.findIndex((m) => m.id === note.moduleId) + 1;
            return (
              <article
                key={note.id}
                className={cn(
                  "rounded-xl p-5 shadow-sm",
                  note.pinned ? "bg-surface-info-badge" : "bg-white",
                )}
              >
                {note.pinned && (
                  <span className="mb-3 inline-flex items-center gap-1 rounded-lg border border-border-info px-2 py-1 text-xs text-text-info">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-neutral-800">
                    {note.title}
                  </h3>
                  <Menu.Root>
                    <Menu.Trigger
                      aria-label={`${note.title} actions`}
                      className="rounded-md p-1 text-neutral-800 hover:bg-neutral-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Menu.Trigger>
                    <Menu.Portal>
                      <Menu.Positioner
                        align="end"
                        sideOffset={6}
                        className="z-50"
                      >
                        <Menu.Popup className="w-40 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
                          <Menu.Item
                            onClick={() => onEditNote(note.id)}
                            className={menuItemClass}
                          >
                            Edit note
                          </Menu.Item>
                          <Menu.Item
                            onClick={() => pinMutation.mutate(note)}
                            className={menuItemClass}
                          >
                            {note.pinned ? "Unpin" : "Pin to top"}
                          </Menu.Item>
                          <Menu.Item
                            onClick={() => setDeleteTarget(note)}
                            className="flex cursor-pointer rounded-md px-3 py-2 text-text-error outline-none data-highlighted:bg-surface-error-badge"
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                  {note.body}
                </p>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                  <Image
                    src="/default-avatar.png"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  {note.author}
                  <span aria-hidden>·</span>
                  {formatDate(note.createdAt)}
                  {modulePosition > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      Module {modulePosition}
                    </>
                  )}
                </p>
              </article>
            );
          })}
        </div>

        <aside>
          <InfoNote title="Visibility">
            <p className="text-sm">
              All notes are only visible only to admins and assigned
              instructors.
            </p>
          </InfoNote>
        </aside>
      </div>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.title ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}

const wholeCurriculum = "curriculum";

/** Adds a note, or edits one when `noteId` is given. */
export function NoteDialog({
  curriculumId,
  noteId,
  onClose,
}: {
  curriculumId: string;
  noteId?: string;
  onClose: () => void;
}) {
  const { api } = useCurriculumScope();
  const notesQuery = useQuery(api.queries.notes(curriculumId));
  const existing = notesQuery.data?.find((n) => n.id === noteId);
  const isReady = !noteId || existing !== undefined;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose={false} className="w-127.5">
        {isReady && (
          <NoteForm
            curriculumId={curriculumId}
            existing={existing}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NoteForm({
  curriculumId,
  existing,
  onClose,
}: {
  curriculumId: string;
  existing?: CurriculumNote;
  onClose: () => void;
}) {
  const { api } = useCurriculumScope();
  const queryClient = useQueryClient();
  const modulesQuery = useQuery(api.queries.modules(curriculumId));
  const noteId = existing?.id;

  const [title, setTitle] = React.useState(existing?.title ?? "");
  const [body, setBody] = React.useState(existing?.body ?? "");
  const [attachTo, setAttachTo] = React.useState(
    existing ? (existing.moduleId ?? wholeCurriculum) : "",
  );

  const modules = modulesQuery.data ?? [];
  const selectedAttachTo = attachTo || modules[0]?.id || wholeCurriculum;

  const saveMutation = useMutation({
    mutationFn: async (input: SaveNoteInput) => {
      if (noteId) await api.updateNote(curriculumId, noteId, input);
      else await api.createNote(curriculumId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: api.keys.notes(curriculumId),
      });
      onClose();
    },
  });

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    !saveMutation.isPending;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <DialogTitle>{noteId ? "Edit note" : "Add note"}</DialogTitle>
          <DialogDescription className="mt-1 text-neutral-500">
            Add an internal note about this curriculum
          </DialogDescription>
        </div>
        <DialogClose
          aria-label="Close"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-800 hover:bg-neutral-100"
        >
          <X className="h-4 w-4" />
        </DialogClose>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <FormField
          label="Title"
          required
          inputProps={{
            type: "basic",
            size: "medium",
            value: title,
            onChange: (event) => setTitle(event.target.value),
            placeholder: "Curriculum update",
            leadingIcon: null,
          }}
        />
        <Field.Root className="flex flex-col">
          <Label required>Note</Label>
          <div className="mt-1.5">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Redesign a simple landing page using hierarchy and contrast"
              className="min-h-24"
            />
          </div>
        </Field.Root>
        <Select
          size="large"
          label="Attach to"
          required
          value={selectedAttachTo}
          onChange={setAttachTo}
          options={[
            ...modules.map((m, index) => ({
              value: m.id,
              label: `Module ${index + 1} - ${m.title}`,
            })),
            { value: wholeCurriculum, label: "Whole curriculum" },
          ]}
        />
      </div>

      {saveMutation.isError && (
        <p className="mt-4 text-sm text-text-error">
          {saveMutation.error.message}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <DialogClose
          render={
            <Button
              variant="secondary"
              size="lg"
              className="border-neutral-200 text-neutral-800"
            />
          }
        >
          Back
        </DialogClose>
        <Button
          size="lg"
          disabled={!canSubmit}
          onClick={() =>
            saveMutation.mutate({
              title: title.trim(),
              body: body.trim(),
              moduleId:
                selectedAttachTo === wholeCurriculum ? null : selectedAttachTo,
            })
          }
        >
          {saveMutation.isPending
            ? "Saving…"
            : noteId
              ? "Save note"
              : "Add note"}
        </Button>
      </div>
    </>
  );
}
