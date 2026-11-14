"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Cancel01, Copy01, Download02, Mail02 } from "@/assets/icons";
import { resendInvite, type AdminUser } from "@/lib/admin";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

type Person = { name: string; email: string };

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv<T>(rows: T[], columns: ExportColumn<T>[], fileName: string) {
  const lines = [
    columns.map((column) => csvCell(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => csvCell(column.value(row))).join(","),
    ),
  ];
  const blob = new Blob([lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const actionClass =
  "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-work text-sm font-medium text-text-primary transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent";

export function SelectionAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return <button type="button" className={cn(actionClass, className)} {...props} />;
}

/**
 * Floats at the bottom of the screen while rows are ticked, with what can be
 * done to all of them at once. Escape clears the selection.
 */
export function PeopleSelectionBar<T extends Person>({
  items,
  noun,
  onClear,
  exportColumns,
  exportFileName,
  actions,
}: {
  items: T[];
  /** e.g. { singular: "student", plural: "students" } */
  noun: { singular: string; plural: string };
  onClear: () => void;
  exportColumns: ExportColumn<T>[];
  exportFileName: string;
  /** Extra actions for this table, placed before Clear. `notify` shows a short result. */
  actions?: (notify: (message: string) => void) => React.ReactNode;
}) {
  const [note, setNote] = React.useState("");
  const count = items.length;

  React.useEffect(() => {
    if (count === 0) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClear();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, onClear]);

  React.useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 3000);
    return () => window.clearTimeout(timer);
  }, [note]);

  if (count === 0) return null;

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(items.map((item) => item.email).join(", "));
      setNote(`Copied ${count} email${count === 1 ? "" : "s"}`);
    } catch {
      setNote("Couldn't copy. Check your browser's clipboard permission.");
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div
        role="region"
        aria-label="Selected rows"
        className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-0 p-1.5 shadow-lg"
      >
        <span className="flex h-8 shrink-0 items-center gap-2 pr-2 pl-2.5 font-work text-sm text-text-primary">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-primary px-1.5 text-xs font-semibold text-neutral-0">
            {count}
          </span>
          {count === 1 ? noun.singular : noun.plural} selected
        </span>
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-neutral-200" />

        <SelectionAction onClick={copyEmails}>
          <Copy01 className="size-4" />
          Copy emails
        </SelectionAction>
        <SelectionAction
          onClick={() => downloadCsv(items, exportColumns, exportFileName)}
        >
          <Download02 className="size-4" />
          Export CSV
        </SelectionAction>
        {actions?.(setNote)}

        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-neutral-200" />
        <SelectionAction onClick={onClear} aria-label="Clear selection" title="Clear selection (Esc)">
          <Cancel01 className="size-4" />
          <span className="hidden sm:inline">Clear</span>
        </SelectionAction>

        <span role="status" className="sr-only sm:not-sr-only">
          {note && (
            <span className="shrink-0 px-2 font-work text-xs whitespace-nowrap text-text-muted">
              {note}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Resends the invite to every ticked person who hasn't finished onboarding.
 * Super admins only, like the row menu's Resend invite.
 */
export function ResendInvitesAction({
  users,
  onResult,
}: {
  users: AdminUser[];
  onResult: (message: string) => void;
}) {
  const { data: session } = useQuery(sessionQuery());
  const invited = users.filter((user) => user.onboardingStatus === "INVITED");
  const canManage = session?.user.role === "SUPERADMIN";

  const resend = useMutation({
    mutationFn: async (targets: AdminUser[]) => {
      const results = await Promise.allSettled(
        targets.map((user) => resendInvite(user.id)),
      );
      return results.filter((result) => result.status === "rejected").length;
    },
    onSuccess: (failed, targets) => {
      const sent = targets.length - failed;
      onResult(
        failed === 0
          ? `Resent ${sent} invite${sent === 1 ? "" : "s"}`
          : `Resent ${sent}, ${failed} failed`,
      );
    },
  });

  return (
    <SelectionAction
      disabled={!canManage || invited.length === 0 || resend.isPending}
      title={
        !canManage
          ? "Only super admins can do this"
          : invited.length === 0
            ? "Everyone selected has already finished onboarding"
            : undefined
      }
      onClick={() => resend.mutate(invited)}
    >
      <Mail02 className="size-4" />
      {resend.isPending
        ? "Sending…"
        : `Resend invite${invited.length === 1 ? "" : "s"}${invited.length ? ` (${invited.length})` : ""}`}
    </SelectionAction>
  );
}
