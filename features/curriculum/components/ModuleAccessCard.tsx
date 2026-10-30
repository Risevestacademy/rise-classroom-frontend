"use client";

import * as React from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LockOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurriculumScope } from "@/features/curriculum/scope";
import type { ModuleAccess, ModuleStatus } from "@/features/curriculum/types";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/* The sentence under the heading, from the last unlock or lock. */
function accessSummary(access: ModuleAccess) {
  if (access.studentCount === 0) return "No students are enrolled on this track yet.";
  if (!access.unlocked) return `Locked for all ${plural(access.studentCount, "student")}.`;

  const waiting = access.studentCount - access.openCount;
  return waiting === 0
    ? `Unlocked for all ${plural(access.studentCount, "student")}.`
    : `Unlocked for ${plural(access.studentCount, "student")}. ${waiting} will get in once they finish the modules before this one.`;
}

/*
 * Lets an instructor open a module to every student on the track, or close it again.
 * The API can't be asked whether a module is unlocked, so the card shows what the
 * last change did and offers both actions until then.
 */
export function ModuleAccessCard({
  moduleId,
  moduleStatus,
}: {
  moduleId: string;
  moduleStatus: ModuleStatus;
}) {
  const { api } = useCurriculumScope();
  const queryClient = useQueryClient();
  const accessKey = api.keys.moduleAccess(moduleId);
  const { data: access } = useQuery<ModuleAccess>({
    queryKey: accessKey,
    queryFn: skipToken,
    staleTime: Infinity,
  });
  const [confirmLock, setConfirmLock] = React.useState(false);

  const accessMutation = useMutation({
    mutationFn: (unlocked: boolean) => api.setModuleAccess(moduleId, unlocked),
    onSuccess: (result) => {
      queryClient.setQueryData(accessKey, result);
      setConfirmLock(false);
    },
  });

  const isPending = accessMutation.isPending;
  const pendingUnlock = isPending && accessMutation.variables === true;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-800">
          {access?.unlocked ? (
            <LockOpen className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Student access
        </p>
        {access && (
          <Badge variant="light" status={access.unlocked ? "success" : "neutral"}>
            {access.unlocked ? "Unlocked" : "Locked"}
          </Badge>
        )}
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        {access
          ? accessSummary(access)
          : "Unlock this module to let every student on the track open its lessons. You can lock it again at any time."}
      </p>

      {access?.unlocked && access.studentCount > 0 && (
        <p className="mt-2 text-xs text-neutral-500">
          Lessons you add later stay locked until you unlock the module again.
        </p>
      )}

      {moduleStatus === "DRAFT" && (
        <p className="mt-2 text-xs text-text-warning">
          This module is a draft. Students won&apos;t see it until it&apos;s
          published, even when it&apos;s unlocked.
        </p>
      )}

      {accessMutation.isError && !confirmLock && (
        <p role="alert" className="mt-2 text-xs text-text-error">
          {accessMutation.error.message}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!access?.unlocked && (
          <Button
            size="medium"
            disabled={isPending}
            onClick={() => accessMutation.mutate(true)}
          >
            <LockOpen className="h-4 w-4" />
            {pendingUnlock ? "Unlocking…" : "Unlock for students"}
          </Button>
        )}
        {access?.unlocked !== false && (
          <Button
            variant="secondary"
            size="medium"
            disabled={isPending}
            onClick={() => setConfirmLock(true)}
            className="border-neutral-200 text-neutral-800"
          >
            <Lock className="h-4 w-4" />
            Lock
          </Button>
        )}
      </div>

      <Dialog open={confirmLock} onOpenChange={(open) => !open && setConfirmLock(false)}>
        <DialogContent
          showClose={false}
          className="flex w-92.5 flex-col items-center text-center sm:p-6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-warning-badge text-text-warning">
            <Lock className="h-4 w-4" />
          </span>
          <DialogTitle className="mt-5 text-base font-semibold">
            Lock this module?
          </DialogTitle>
          <DialogDescription className="mt-2 text-neutral-500">
            Students on the track won&apos;t be able to open its lessons until
            you unlock it again.
          </DialogDescription>
          {accessMutation.isError && (
            <p role="alert" className="mt-3 text-xs text-text-error">
              {accessMutation.error.message}
            </p>
          )}
          <div className="mt-5 flex gap-2">
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
              disabled={isPending}
              onClick={() => accessMutation.mutate(false)}
            >
              {isPending ? "Locking…" : "Yes, lock it"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
