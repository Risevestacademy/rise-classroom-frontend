"use client";

import Link from "next/link";
import { BookOpen, Lock, Play, WifiOff } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { CardEmptyState } from "@/components/student-dashboard/DashboardParts";
import { continueLearning } from "@/lib/student-dashboard";
import { LESSONS_BASE, useStudentCurriculum } from "@/lib/student-lessons";

const actionClass =
  "inline-flex h-9 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:bg-brand-primary-hover";

function GreyCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-78 flex-col rounded-3xl bg-neutral-100 px-6 pt-8 pb-8">
      <h2 className="text-xl font-medium text-neutral-800">Continue Learning</h2>
      {children}
    </section>
  );
}

/**
 * Where the student left off, leading into the learning pages: the artwork
 * and "Resume learning" open the current module, as the curriculum does.
 */
export function ContinueLearningCard() {
  const curriculum = useStudentCurriculum();

  if (curriculum.isPending) {
    return (
      <section className="rounded-3xl bg-brand-primary px-6 pt-8 pb-8">
        <h2 className="text-xl font-medium text-white">Continue Learning</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-[2/1] w-full rounded-2xl bg-white/10" />
          <div className="flex flex-col justify-center gap-3">
            <Skeleton className="h-3 w-28 bg-white/10" />
            <Skeleton className="h-5 w-40 bg-white/10" />
            <Skeleton className="h-2 w-full bg-white/10" />
            <Skeleton className="h-10 w-36 bg-white/10" />
          </div>
        </div>
      </section>
    );
  }

  if (curriculum.notEnrolled) {
    return (
      <GreyCard>
        <CardEmptyState
          onGrey
          icon={Lock}
          title="You're not enrolled on a track yet"
          description="Once your program admin enrolls you, your modules will show up here."
        />
      </GreyCard>
    );
  }

  if (curriculum.error || !curriculum.enrollment) {
    return (
      <GreyCard>
        <CardEmptyState
          onGrey
          icon={WifiOff}
          title="Couldn't load your progress"
          description="Check your internet connection and try again."
          action={
            <button type="button" onClick={() => curriculum.refetch()} className={actionClass}>
              Try again
            </button>
          }
        />
      </GreyCard>
    );
  }

  const current = continueLearning(curriculum.enrollment, curriculum.topics);

  if (!current) {
    return (
      <GreyCard>
        <CardEmptyState
          onGrey
          icon={BookOpen}
          title="No module started yet"
          description="Open the curriculum to start your first module. Your progress will show up here."
          action={
            <Link href={LESSONS_BASE} className={actionClass}>
              View curriculum
            </Link>
          }
        />
      </GreyCard>
    );
  }

  const position = [
    `Module ${current.moduleNumber}`,
    current.lessonNumber && `Lesson ${current.lessonNumber}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="rounded-3xl bg-brand-primary px-6 pt-8 pb-8 text-white">
      <h2 className="text-xl font-medium">Continue Learning</h2>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Link
          href={current.href}
          aria-label={`Open ${current.moduleTitle}`}
          className="group relative block aspect-[2/1] overflow-hidden rounded-2xl bg-brand-100"
        >
          {current.thumbnail ? (
            // A still from the video host, shown as it is.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <span className="absolute -top-6 -left-6 h-28 w-28 rounded-full bg-brand-primary/90" />
              <span className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-brand-300" />
              <span className="absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-brand-400" />
            </>
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800/70 text-white transition-transform group-hover:scale-105">
              <Play className="h-5 w-5 fill-current" />
            </span>
          </span>
        </Link>

        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-sm text-brand-200">{position}</p>
          <p className="mt-6 truncate text-sm text-brand-200">{current.moduleTitle}</p>
          <p className="mt-1 text-xl font-medium">
            {current.trackComplete
              ? "Track complete"
              : (current.lessonTitle ?? current.moduleTitle)}
          </p>

          <div
            role="progressbar"
            aria-label="Track progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={current.percentage}
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white"
          >
            <div
              className="h-full rounded-full bg-brand-300"
              style={{ width: `${current.percentage}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-brand-200">{current.percentage}% complete</p>

          <div className="pt-4">
            <Link
              href={current.href}
              className="inline-flex h-10 items-center rounded-lg bg-brand-300 px-5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-200"
            >
              {current.trackComplete ? "Review track" : "Resume learning"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
