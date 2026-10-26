"use client";

import { Menu } from "@base-ui/react/menu";
import { Pin } from "lucide-react";

import { InformationCircle, MoreHorizontal } from "@/assets/icons";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";
import { profileNotes } from "@/app/admin/students/[id]/profile-data";

type Note = (typeof profileNotes)[number];

export function NotesTab() {
  // Pinned notes sit at the top.
  const notes = [...profileNotes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned),
  );

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,799fr)_minmax(0,321fr)]">
      <ul className="flex min-w-0 flex-col gap-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </ul>

      <aside className="flex items-start gap-3 rounded-xl bg-surface-brand p-5 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
        <InformationCircle className="size-5 shrink-0 text-icon-primary" />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-text-primary">Visibility</p>
          <p className="font-work text-[13px]/[18px] text-text-secondary">
            All notes are only visible only to admins, mentor and assigned
            instructor.
          </p>
        </div>
      </aside>
    </div>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg p-5 shadow-[0_1px_3px_rgb(0_0_0/0.15)]",
        note.pinned ? "bg-surface-brand" : "bg-surface-default",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {note.pinned ? (
          <span className="flex h-7 items-center gap-1 rounded-full border border-border-info p-2 text-sm font-medium text-text-info">
            <Pin className="size-4" />
            Pinned
          </span>
        ) : (
          <h3 className="text-lg/6 font-semibold text-text-primary">
            {note.title}
          </h3>
        )}
        <NoteMenu note={note} />
      </div>

      {note.pinned && (
        <h3 className="text-lg/6 font-semibold text-text-primary">
          {note.title}
        </h3>
      )}
      <p className="font-work text-sm text-text-secondary">{note.body}</p>

      <div className="flex items-center gap-2.5">
        <InitialsAvatar
          name={note.author}
          className="size-8 font-work text-xs font-normal"
        />
        <div className="flex flex-col font-work">
          <p className="text-sm font-medium text-text-primary">{note.author}</p>
          <p className="text-[13px]/[18px] text-text-secondary">{note.role}</p>
        </div>
        <span aria-hidden className="mx-2.5 h-[38px] w-px bg-border-default" />
        <p className="font-work text-[13px]/[18px] text-text-muted">
          {note.date}
        </p>
      </div>
    </li>
  );
}

/** PENDING-BACKEND: notes can't be pinned or deleted yet. */
function NoteMenu({ note }: { note: Note }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`${note.title} options`}
        className="flex size-8 shrink-0 items-center justify-center text-icon-primary"
      >
        <MoreHorizontal className="size-6" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="flex flex-col bg-surface-subtle p-2.5 font-work text-sm shadow-[0_1px_3px_rgb(0_0_0/0.15)] outline-none">
            <Menu.Item className="flex cursor-pointer p-2 text-text-primary outline-none data-highlighted:bg-neutral-200">
              {note.pinned ? "Unpin note" : "Pin note"}
            </Menu.Item>
            <Menu.Item className="flex cursor-pointer p-2 text-text-error outline-none data-highlighted:bg-neutral-200">
              Delete note
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
