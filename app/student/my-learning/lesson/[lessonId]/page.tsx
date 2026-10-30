"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonVideo } from "@/components/lessons/LessonVideo";
import { Notice } from "@/components/lessons/Notice";
import { ResourceRow } from "@/components/lessons/ResourceRow";
import { submissionBadges, type SubmissionStatus } from "@/features/curriculum/types";
import { studentQueries } from "@/lib/student";
import {
  assignmentHref,
  studentAssignmentQueries,
} from "@/lib/student-assignments";
import {
  LESSONS_BASE,
  countWatched,
  findLesson,
  flattenTopics,
  lessonHref,
  lessonQueries,
  type CurriculumTopic,
  type LessonAssignment,
  type LessonDetail,
} from "@/lib/student-lessons";

/* What the assignment button offers, depending on how far the student has got. */
const assignmentActions: Record<SubmissionStatus | "NONE", string> = {
  NONE: "Start assignment",
  DRAFT: "Continue assignment",
  CHANGES_REQUESTED: "Make changes",
  SUBMITTED: "View submission",
  UNDER_REVIEW: "View submission",
  GRADED: "View feedback",
};

function AssignmentCard({ assignment }: { assignment: LessonAssignment }) {
  const submissionQuery = useQuery(
    studentAssignmentQueries.submission(assignment.id),
  );
  const submission = submissionQuery.data;
  const badge = submission ? submissionBadges[submission.status] : null;

  return (
    <div className="rounded-2xl bg-neutral-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-800">{assignment.title}</p>
        {badge && (
          <Badge variant="light" status={badge.status} className="shrink-0">
            {badge.label}
          </Badge>
        )}
      </div>
      {assignment.description && (
        <p className="mt-1 line-clamp-3 text-xs text-neutral-500">
          {assignment.description}
        </p>
      )}
      <Link
        href={assignmentHref(assignment.id)}
        className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:bg-brand-primary-hover"
      >
        {submissionQuery.isPending
          ? "View assignment"
          : assignmentActions[submission?.status ?? "NONE"]}
      </Link>
    </div>
  );
}

type Tab = "overview" | "resources";

function WeekLessons({
  topic,
  week,
  currentLessonId,
}: {
  topic: CurriculumTopic;
  week: number;
  currentLessonId: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-800">Week {week}</h2>
        <span className="text-xs text-neutral-400">
          {countWatched(topic)} of {topic.lessons.length} watched
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-2 rounded-2xl bg-neutral-100 p-2">
        {topic.lessons.map((item, index) => {
          const isNow = item.id === currentLessonId;
          const status = isNow
            ? "Now playing"
            : item.completed
              ? "Watched"
              : item.lock.unlocked
                ? null
                : "Locked";
          const row = (
            <>
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500">
                {item.lock.unlocked ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {item.completed && (
                  <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-text-success text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Lesson {index + 1}
                  {status && ` · ${status}`}
                </p>
              </div>
            </>
          );
          const className = cn(
            "flex items-center gap-3 rounded-xl px-3 py-3",
            isNow && "bg-brand-100",
          );
          return (
            <li key={item.id}>
              {item.lock.unlocked && !isNow ? (
                <Link
                  href={lessonHref(item.id)}
                  className={cn(className, "hover:bg-white")}
                >
                  {row}
                </Link>
              ) : (
                <div className={cn(className, !item.lock.unlocked && "opacity-60")}>
                  {row}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LessonView({
  lesson,
  topic,
  week,
  number,
}: {
  lesson: LessonDetail;
  topic: CurriculumTopic;
  week: number;
  number: number;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const resources = lesson.resources ?? [];
  const assignments = lesson.assignments ?? [];
  const watched = lesson.lock.completed;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "resources", label: "Resources", count: resources.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-3 text-xs">
        <Link
          href={LESSONS_BASE}
          aria-label="Back to lessons"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link href={LESSONS_BASE} className="text-neutral-400 hover:text-neutral-600">
          Lessons
        </Link>
        <ChevronRight className="h-3 w-3 text-neutral-400" />
        <span className="text-neutral-400">Week {week}</span>
        <ChevronRight className="h-3 w-3 text-neutral-400" />
        <span className="font-medium text-neutral-800">Lesson {number}</span>
      </nav>

      <div className="grid grid-cols-1 gap-x-6 gap-y-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <LessonVideo key={lesson.id} recordings={lesson.recordings ?? []} />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-medium text-neutral-800">
                {lesson.title}
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Week {week} · Lesson {number}
              </p>
            </div>
            <Badge variant="light" status={watched ? "success" : "neutral"}>
              {watched ? "Watched" : "Not watched"}
            </Badge>
          </div>

          <div>
            <div role="tablist" className="flex gap-6 border-b border-neutral-200">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "-mb-px flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium",
                    tab === item.id
                      ? "border-brand-primary text-neutral-800"
                      : "border-transparent text-neutral-400 hover:text-neutral-600",
                  )}
                >
                  {item.label}
                  {item.count ? (
                    <span className="text-xs text-neutral-400">{item.count}</span>
                  ) : null}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="mt-4">
              {tab === "overview" ? (
                lesson.description ? (
                  <div className="rounded-2xl bg-surface-brand p-4">
                    <p className="text-xs font-medium text-brand-700">
                      Note from your instructor
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {lesson.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">
                    There&apos;s no overview for this lesson yet.
                  </p>
                )
              ) : resources.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  There are no resources for this lesson yet.
                </p>
              ) : (
                <div className="flex flex-col gap-1 rounded-2xl bg-neutral-100 p-2">
                  {resources.map((resource) => (
                    <ResourceRow key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {assignments.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-neutral-800">Assignment</h2>
              <div className="mt-3 flex flex-col gap-3">
                {assignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            </section>
          )}

          <WeekLessons topic={topic} week={week} currentLessonId={lesson.id} />
        </aside>
      </div>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-6 w-[240px]" />
        <Skeleton className="h-4 w-[160px]" />
      </div>
      <Skeleton className="h-[240px] w-full rounded-2xl" />
    </div>
  );
}

function BackToLessons() {
  return (
    <Link
      href={LESSONS_BASE}
      className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-5 text-sm font-medium text-white hover:bg-brand-primary-hover"
    >
      Back to lessons
    </Link>
  );
}

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();

  const progress = useQuery(studentQueries.progress());
  const enrollment =
    progress.data?.find((item) => !item.trackComplete) ?? progress.data?.[0];
  const enrollmentId = enrollment?.enrollmentId;

  const content = useQuery({
    ...lessonQueries.content(enrollmentId ?? ""),
    enabled: Boolean(enrollmentId),
  });
  const lessonQuery = useQuery({
    ...lessonQueries.lesson(enrollmentId ?? "", lessonId),
    enabled: Boolean(enrollmentId),
  });

  const located = findLesson(flattenTopics(content.data), lessonId);

  if (progress.isPending || (enrollmentId && (content.isPending || lessonQuery.isPending))) {
    return <PlayerSkeleton />;
  }

  if (!enrollment) {
    return (
      <Notice
        icon={Lock}
        title="You're not enrolled on a track yet"
        message="Once your program admin enrolls you, your lessons will show up here."
      >
        <BackToLessons />
      </Notice>
    );
  }

  if (lessonQuery.isError || content.isError || !lessonQuery.data) {
    return (
      <Notice
        icon={Lock}
        title="This lesson isn't available"
        message={
          lessonQuery.error?.message ??
          content.error?.message ??
          "It may be locked, or it may not be part of your track."
        }
      >
        <BackToLessons />
      </Notice>
    );
  }

  if (!lessonQuery.data.lock.unlocked) {
    return (
      <Notice
        icon={Lock}
        title="This lesson is locked"
        message="Your instructor will unlock it when it's time."
      >
        <BackToLessons />
      </Notice>
    );
  }

  if (!located) {
    return (
      <Notice
        icon={Lock}
        title="Lesson not found"
        message="This lesson isn't part of your curriculum."
      >
        <BackToLessons />
      </Notice>
    );
  }

  return (
    <LessonView
      key={lessonQuery.data.id}
      lesson={lessonQuery.data}
      topic={located.topic}
      week={located.week}
      number={located.number}
    />
  );
}
