"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Play,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { WorriedLeafy } from "@/components/mascot/Companion";
import { FileChip } from "@/components/lessons/FileChip";
import { Notice } from "@/components/lessons/Notice";
import { assignmentHref } from "@/lib/student-assignments";
import {
  SHOW_MODULE_SAMPLE_DATA,
  getSampleClasses,
  getSampleInstructor,
  type ModuleInstructor,
  type ScheduledClass,
} from "@/lib/module-sample-data";
import {
  LESSONS_BASE,
  countWatched,
  findTopic,
  formatDuration,
  isCompleted,
  isUnlocked,
  lessonHref,
  moduleNumber,
  topicAssignments,
  topicNextLesson,
  useStudentCurriculum,
  type CurriculumTopic,
} from "@/lib/student-lessons";

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-neutral-800">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

function Outcomes({ outcomes }: { outcomes: string[] }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        title="What you'll learn"
        hint="By the end of this module, you'll be able to:"
      />
      <ol className="flex flex-col gap-1 rounded-xl bg-neutral-100 p-2">
        {outcomes.map((outcome, index) => (
          <li
            key={outcome}
            className="flex gap-3 px-2 py-1.5 text-sm text-neutral-700"
          >
            <span className="w-5 shrink-0 text-xs leading-5 text-neutral-400">
              {moduleNumber(index + 1)}
            </span>
            {outcome}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Lessons({ topic }: { topic: CurriculumTopic }) {
  const current = topicNextLesson(topic)?.lesson.id;
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        title="Lessons"
        hint="Open a lesson to watch it and mark it complete."
      />
      <ol className="flex flex-col gap-2">
        {topic.lessons.map((lesson, index) => {
          const unlocked = isUnlocked(lesson);
          const done = isCompleted(lesson);
          const isCurrent = lesson.id === current;
          const duration = lesson.recordings?.[0]?.durationSec;
          const status = !unlocked
            ? " · Locked"
            : done
              ? " · Completed"
              : isCurrent
                ? " · Up next"
                : "";
          return (
            <li
              key={lesson.id}
              className={cn(
                "group relative flex items-start gap-3 rounded-xl border p-4 transition-colors",
                isCurrent
                  ? "border-brand-primary/40 bg-surface-brand"
                  : "border-transparent bg-neutral-100",
                unlocked ? "hover:border-neutral-300" : "opacity-60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  done
                    ? "bg-brand-primary text-white"
                    : isCurrent
                      ? "border-2 border-brand-primary bg-white text-brand-primary"
                      : "border border-neutral-300 bg-white text-neutral-500",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : !unlocked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-400">
                  Lesson {index + 1}
                  {status}
                  {unlocked && duration ? ` · ${formatDuration(duration)}` : ""}
                </p>
                {unlocked ? (
                  <Link
                    href={lessonHref(lesson.id)}
                    className="mt-0.5 block text-sm font-medium text-neutral-800 after:absolute after:inset-0 after:rounded-xl"
                  >
                    {lesson.title}
                  </Link>
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-neutral-800">
                    {lesson.title}
                  </p>
                )}
                {lesson.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                    {lesson.description}
                  </p>
                )}
                {(lesson.resources?.length ?? 0) > 0 && (
                  <div className="relative mt-3 flex flex-wrap gap-2">
                    {lesson.resources!.map((resource) => (
                      <FileChip
                        key={resource.id}
                        title={resource.fileName || resource.title}
                        url={resource.url}
                        type={resource.type}
                        sizeBytes={resource.sizeBytes}
                      />
                    ))}
                  </div>
                )}
              </div>
              {unlocked && (
                <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The module's progress and the one lesson to open next. */
function ModuleHeader({ topic, number }: { topic: CurriculumTopic; number: number }) {
  const total = topic.lessons.length;
  const done = countWatched(topic);
  const next = topicNextLesson(topic);
  const duration = next?.lesson.recordings?.[0]?.durationSec;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium text-neutral-400">Module {number}</p>
        <h1 className="mt-1 text-xl font-medium text-neutral-800">{topic.title}</h1>
        {topic.description && (
          <p className="mt-2 text-sm text-neutral-500">{topic.description}</p>
        )}
        {total > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Lessons completed"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
              className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200"
            >
              <div
                className="h-full rounded-full bg-brand-primary"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-neutral-500">
              {done} of {total} {total === 1 ? "lesson" : "lessons"} completed
            </span>
          </div>
        )}
      </div>

      {next && (
        <Link
          href={lessonHref(next.lesson.id)}
          className="group flex items-center gap-4 rounded-2xl bg-brand-900 p-4 text-white transition-colors hover:bg-brand-800 sm:p-5"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:scale-105">
            <Play className="h-5 w-5 fill-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-white/70">
              {done === 0 ? "Start here" : "Continue"} · Lesson {next.number}
              {duration ? ` · ${formatDuration(duration)}` : ""}
            </span>
            <span className="mt-0.5 block truncate text-base font-medium">
              {next.lesson.title}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function Assignments({ topic }: { topic: CurriculumTopic }) {
  const items = topicAssignments(topic);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        title="Assignments"
        hint="Practical exercises to apply what you've learned."
      />
      <ul className="flex flex-col gap-4">
        {items.map(({ assignment, lesson }, index) => {
          const lessonNumber = lesson
            ? topic.lessons.findIndex((item) => item.id === lesson.id) + 1
            : null;
          return (
            <li key={assignment.id} className="flex flex-col items-start gap-3">
              <div className="w-full rounded-xl bg-neutral-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-neutral-400">
                    Assignment {index + 1}
                    {lesson && ` · ${lesson.title}`}
                  </p>
                  {lessonNumber && (
                    <span className="shrink-0 text-xs font-medium text-text-info">
                      Attached to lesson {lessonNumber}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-neutral-800">
                  {assignment.title}
                </p>
                {assignment.description && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {assignment.description}
                  </p>
                )}
                {assignment.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignment.attachments.map((attachment) => (
                      <FileChip
                        key={attachment.id}
                        title={attachment.title}
                        url={attachment.downloadUrl}
                        type={
                          attachment.mimeType === "application/pdf"
                            ? "PDF"
                            : "DOCUMENT"
                        }
                        sizeBytes={attachment.sizeBytes}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Link
                href={assignmentHref(assignment.id)}
                className="inline-flex h-8 items-center rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
              >
                View assignment
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SupportingResources({ topic }: { topic: CurriculumTopic }) {
  const resources = topic.resources ?? [];
  if (resources.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading title="Supporting resources" />
      <div className="flex flex-wrap gap-2 rounded-xl bg-neutral-100 p-3">
        {resources.map((resource) => (
          <FileChip
            key={resource.id}
            title={resource.fileName || resource.title}
            url={resource.url}
            type={resource.type}
            sizeBytes={resource.sizeBytes}
          />
        ))}
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/* PENDING-BACKEND: no student endpoint returns the module's instructor yet. */
function InstructorCard({
  instructor,
}: {
  instructor: ModuleInstructor | null;
}) {
  return (
    <section className="rounded-xl bg-neutral-100 p-4">
      <h2 className="text-xs text-neutral-400">Instructor</h2>
      {instructor ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-brand text-xs font-medium text-brand-primary">
            {initials(instructor.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">
              {instructor.name}
            </p>
            <p className="truncate text-xs text-neutral-400">
              {instructor.email}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">
          Your instructor&apos;s details will show here.
        </p>
      )}
    </section>
  );
}

const classDate = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

/* PENDING-BACKEND: there's no endpoint for scheduled live classes yet. */
function LiveClassesCard({ classes }: { classes: ScheduledClass[] }) {
  return (
    <section className="rounded-xl bg-neutral-100 p-4">
      <h2 className="text-sm font-medium text-neutral-800">Live classes</h2>
      <p className="mt-0.5 text-xs text-neutral-400">
        Live sessions for this module.
      </p>
      {classes.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {classes.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-neutral-800">
                  {item.title}
                </p>
                <p className="text-xs text-neutral-400">
                  {classDate.format(item.startsAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">
          No live classes scheduled yet.
        </p>
      )}
    </section>
  );
}

function ModuleView({
  topic,
  number,
}: {
  topic: CurriculumTopic;
  number: number;
}) {
  const outcomes = (topic.outcomes ?? []).filter((item) => item.trim());
  const instructor = SHOW_MODULE_SAMPLE_DATA ? getSampleInstructor() : null;
  const classes = useMemo(
    () => (SHOW_MODULE_SAMPLE_DATA ? getSampleClasses(topic) : []),
    [topic],
  );

  return (
    <div className="grid max-w-[1100px] grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-8">
        <Link
          href={LESSONS_BASE}
          className="-mb-2 inline-flex items-center gap-1 self-start text-sm font-medium text-neutral-800 lg:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
          Module {number}
        </Link>

        <ModuleHeader topic={topic} number={number} />

        {outcomes.length > 0 && <Outcomes outcomes={outcomes} />}
        {topic.lessons.length > 0 && <Lessons topic={topic} />}
        <Assignments topic={topic} />
        <SupportingResources topic={topic} />
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <InstructorCard instructor={instructor} />
        <LiveClassesCard classes={classes} />
      </aside>
    </div>
  );
}

function ModuleSkeleton() {
  return (
    <div className="flex max-w-[780px] flex-col gap-6">
      <Skeleton className="h-6 w-[240px]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

function BackToCurriculum() {
  return (
    <Link
      href={LESSONS_BASE}
      className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-5 text-sm font-medium text-white hover:bg-brand-primary-hover"
    >
      Back to curriculum
    </Link>
  );
}

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const curriculum = useStudentCurriculum();

  if (curriculum.isPending) return <ModuleSkeleton />;

  if (curriculum.notEnrolled) {
    return (
      <Notice
        icon={Lock}
        title="You're not enrolled on a track yet"
        message="Once your program admin enrolls you, your modules will show up here."
      >
        <BackToCurriculum />
      </Notice>
    );
  }

  if (curriculum.error) {
    return (
      <Notice
        icon={WorriedLeafy}
        title="Couldn't load this module"
        message="Check your internet connection and try again."
      >
        <button
          type="button"
          onClick={() => curriculum.refetch()}
          className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-5 text-sm font-medium text-white hover:bg-brand-primary-hover"
        >
          Try again
        </button>
      </Notice>
    );
  }

  const located = findTopic(curriculum.topics, moduleId);

  if (!located) {
    return (
      <Notice
        icon={Lock}
        title="Module not found"
        message="This module isn't part of your curriculum."
      >
        <BackToCurriculum />
      </Notice>
    );
  }

  if (!isUnlocked(located.topic)) {
    return (
      <Notice
        icon={Lock}
        title="This module is locked"
        message="Your instructor will unlock it when it's time."
      >
        <BackToCurriculum />
      </Notice>
    );
  }

  return <ModuleView topic={located.topic} number={located.number} />;
}
