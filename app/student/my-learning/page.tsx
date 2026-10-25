"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, Lock, Paperclip, Play } from "lucide-react";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/lessons/Notice";
import { studentQueries } from "@/lib/student";
import {
  countWatched,
  flattenTopics,
  formatDuration,
  lessonHref,
  lessonQueries,
  type CurriculumLesson,
  type CurriculumTopic,
} from "@/lib/student-lessons";

function LessonCard({
  lesson,
  number,
  enrollmentId,
}: {
  lesson: CurriculumLesson;
  number: number;
  enrollmentId: string;
}) {
  const unlocked = lesson.lock.unlocked;

  // Duration and resource count only come with the lesson detail.
  const detail = useQuery({
    ...lessonQueries.lesson(enrollmentId, lesson.id),
    enabled: unlocked,
  });
  const duration = detail.data?.recordings?.[0]?.durationSec;
  const resourceCount = detail.data?.resources?.length;

  const body = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-brand-100">
        <span className="absolute -top-6 -left-6 h-[96px] w-[96px] rounded-full bg-brand-primary/90" />
        <span className="absolute -right-6 -bottom-8 h-[112px] w-[112px] rounded-full bg-brand-300" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800/70 text-white">
            {unlocked ? (
              <Play className="h-4 w-4 fill-current" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </span>
        </span>
        <span className="absolute top-3 left-3">
          {unlocked ? (
            <Badge variant="light" status={lesson.completed ? "success" : "neutral"}>
              {lesson.completed ? "Watched" : "Not watched"}
            </Badge>
          ) : (
            <Badge variant="light" status="neutral">
              Locked
            </Badge>
          )}
        </span>
        {duration ? (
          <span className="absolute right-3 bottom-3 rounded-md bg-brand-primary px-2 py-1 text-xs font-medium text-white">
            {formatDuration(duration)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 truncate text-base font-medium text-neutral-800">
        {lesson.title}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-neutral-400">
        <span>Lesson {number}</span>
        {resourceCount ? (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {resourceCount} {resourceCount === 1 ? "resource" : "resources"}
          </span>
        ) : null}
      </div>
    </>
  );

  return unlocked ? (
    <Link
      href={lessonHref(lesson.id)}
      className="block rounded-2xl border border-neutral-200 bg-surface-brand p-3 transition-colors hover:border-brand-300"
    >
      {body}
    </Link>
  ) : (
    <div
      aria-disabled
      className="block rounded-2xl border border-neutral-200 bg-surface-brand p-3 opacity-60"
    >
      {body}
    </div>
  );
}

function WeekSection({
  topic,
  weekNumber,
  isCurrent,
  defaultOpen,
  enrollmentId,
}: {
  topic: CurriculumTopic;
  weekNumber: number;
  isCurrent: boolean;
  defaultOpen: boolean;
  enrollmentId: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const watched = countWatched(topic);
  const total = topic.lessons.length;
  const allWatched = total > 0 && watched === total;

  return (
    <section className="border-b border-neutral-200 py-4 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="text-base font-medium text-neutral-800">
          Week {weekNumber}
        </span>
        {isCurrent && (
          <Badge variant="light" status="info">
            This week
          </Badge>
        )}
        <span
          className={cn(
            "text-xs",
            allWatched ? "text-text-success" : "text-text-warning",
          )}
        >
          {watched} of {total} watched
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-5 w-5 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        (total === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">
            No lessons in this week yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {topic.lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                number={index + 1}
                enrollmentId={enrollmentId}
              />
            ))}
          </div>
        ))}
    </section>
  );
}

function EarlierWeeks({
  topics,
  weekOf,
  enrollmentId,
}: {
  topics: CurriculumTopic[];
  weekOf: Map<string, number>;
  enrollmentId: string;
}) {
  const [open, setOpen] = useState(false);
  const weeks = topics.map((topic) => weekOf.get(topic.id) ?? 0);
  const first = Math.min(...weeks);
  const last = Math.max(...weeks);
  const watched = topics.reduce((sum, topic) => sum + countWatched(topic), 0);
  const total = topics.reduce((sum, topic) => sum + topic.lessons.length, 0);
  const allWatched = total > 0 && watched === total;

  return (
    <section className="py-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="text-base font-medium text-neutral-800">
          {first === last ? `Week ${first}` : `Weeks ${first} to ${last}`}
        </span>
        <span
          className={cn(
            "text-xs",
            allWatched ? "text-text-success" : "text-text-warning",
          )}
        >
          {watched} of {total} watched
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-5 w-5 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-4 rounded-2xl bg-white px-4 py-2 shadow-sm">
          {topics.map((topic) => (
            <WeekSection
              key={topic.id}
              topic={topic}
              weekNumber={weekOf.get(topic.id) ?? 0}
              isCurrent={false}
              defaultOpen={false}
              enrollmentId={enrollmentId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function WeekList({
  topics,
  currentTopicId,
  enrollmentId,
}: {
  topics: CurriculumTopic[];
  currentTopicId: string | undefined;
  enrollmentId: string;
}) {
  // Weeks the student can't reach yet aren't in the design, so they're hidden.
  const weekOf = new Map(topics.map((topic, index) => [topic.id, index + 1]));
  const visible = topics.filter(
    (topic) => topic.lock.unlocked || topic.id === currentTopicId,
  );

  // Newest first. The current week and the two before it stay on their own;
  // anything older is grouped, as in the design.
  const newestFirst = [...visible].reverse();
  const currentIndex = newestFirst.findIndex((topic) => topic.id === currentTopicId);
  const keep = currentIndex === -1 ? 3 : currentIndex + 3;
  const individual = newestFirst.slice(0, keep);
  const earlier = newestFirst.slice(keep).reverse();

  if (visible.length === 0) {
    return (
      <Notice
        icon={BookOpen}
        title="No lessons available yet"
        message="Lessons will appear here as your instructor unlocks them."
      />
    );
  }

  return (
    <div className="rounded-2xl bg-white px-6 py-6 shadow-sm">
      {individual.map((topic) => (
        <WeekSection
          key={topic.id}
          topic={topic}
          weekNumber={weekOf.get(topic.id) ?? 0}
          isCurrent={topic.id === currentTopicId}
          defaultOpen={topic.id === currentTopicId}
          enrollmentId={enrollmentId}
        />
      ))}
      {earlier.length > 0 && (
        <EarlierWeeks
          topics={earlier}
          weekOf={weekOf}
          enrollmentId={enrollmentId}
        />
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <Skeleton className="h-6 w-[160px]" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
      </div>
      <Skeleton className="h-6 w-[200px]" />
      <Skeleton className="h-6 w-[200px]" />
    </div>
  );
}

export default function LessonsPage() {
  const progress = useQuery(studentQueries.progress());

  // Same pick as the dashboard: the track still being worked through.
  const enrollment =
    progress.data?.find((item) => !item.trackComplete) ?? progress.data?.[0];
  const enrollmentId = enrollment?.enrollmentId;

  const content = useQuery({
    ...lessonQueries.content(enrollmentId ?? ""),
    enabled: Boolean(enrollmentId),
  });

  const notEnrolled =
    progress.error instanceof ApiError && progress.error.status === 404;

  const topics = flattenTopics(content.data);
  const currentTopicId = enrollment?.currentTopic?.id;
  const currentWeek = topics.findIndex((topic) => topic.id === currentTopicId) + 1;

  let body: React.ReactNode;
  if (progress.isPending || (enrollmentId && content.isPending)) {
    body = <ListSkeleton />;
  } else if (notEnrolled || (!progress.isError && !enrollment)) {
    body = (
      <Notice
        icon={BookOpen}
        title="You're not enrolled on a track yet"
        message="Once your program admin enrolls you, your lessons will show up here."
      />
    );
  } else if (progress.isError || content.isError || !enrollment || !enrollmentId) {
    body = (
      <Notice
        icon={BookOpen}
        title="Couldn't load your lessons"
        message={
          content.error?.message ??
          progress.error?.message ??
          "Please try again shortly."
        }
      />
    );
  } else {
    body = (
      <WeekList
        topics={topics}
        currentTopicId={currentTopicId}
        enrollmentId={enrollmentId}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium text-neutral-800">Lessons</h1>
        {enrollment && (
          <p className="mt-1 text-sm text-neutral-500">
            {enrollment.track.name}
            {currentWeek > 0 && ` · Week ${currentWeek} of ${topics.length}`}
          </p>
        )}
      </div>

      {body}
    </div>
  );
}
