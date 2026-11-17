"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurriculumScope } from "@/features/curriculum/scope";

/*
 * Opens or closes one lesson for every student on the track. The API only
 * unlocks a lesson once its module is unlocked, so until then it stays locked.
 */
export function LessonAccessButton({
  curriculumId,
  moduleId,
  lessonId,
  lessonName,
  unlocked,
  moduleUnlocked,
}: {
  curriculumId: string;
  moduleId: string;
  lessonId: string;
  /** e.g. "lesson 2", for the button's label. */
  lessonName: string;
  unlocked: boolean;
  moduleUnlocked: boolean;
}) {
  const { api } = useCurriculumScope();
  const queryClient = useQueryClient();

  const accessMutation = useMutation({
    mutationFn: (next: boolean) => api.setLessonAccess(lessonId, next),
    onSuccess: () => api.refreshModule(queryClient, curriculumId, moduleId),
  });

  const blocked = !unlocked && !moduleUnlocked;
  const isPending = accessMutation.isPending;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        aria-pressed={unlocked}
        aria-label={
          unlocked
            ? `Unlocked. Lock ${lessonName}`
            : `Locked. Unlock ${lessonName}`
        }
        title={
          blocked
            ? "Unlock the module first"
            : unlocked
              ? "Click to lock"
              : "Click to unlock"
        }
        disabled={isPending || blocked}
        onClick={() => accessMutation.mutate(!unlocked)}
        className={
          unlocked
            ? "border-transparent bg-surface-success-badge text-text-success"
            : "border-neutral-200 bg-white text-neutral-800"
        }
      >
        {unlocked ? (
          <LockOpen className="h-3.5 w-3.5" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        )}
        {isPending
          ? accessMutation.variables
            ? "Unlocking…"
            : "Locking…"
          : unlocked
            ? "Unlocked"
            : "Locked"}
      </Button>
      {accessMutation.isError && (
        <p role="alert" className="max-w-48 text-right text-xs text-text-error">
          {accessMutation.error.message}
        </p>
      )}
    </div>
  );
}
