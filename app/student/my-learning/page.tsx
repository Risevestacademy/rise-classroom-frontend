"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  ChevronRight,
  Lock,
  Paperclip,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { WorriedLeafy } from "@/components/mascot/Companion";
import {
  countTopicResources,
  countWatched,
  isUnlocked,
  moduleHref,
  moduleNumber,
  topicAssignments,
  topicNextLesson,
  topicRecordings,
  useStudentCurriculum,
  type CurriculumTopic,
} from "@/lib/student-lessons";

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function Included({ topic }: { topic: CurriculumTopic }) {
  const recordings = topicRecordings(topic).length;
  const lessons = topic.counts?.lessons ?? topic.lessons.length;
  const assignments = topicAssignments(topic).length;
  const resources = countTopicResources(topic);

  const items = [
    recordings > 0 && {
      icon: Video,
      label:
        recordings === 1
          ? "Live class recording"
          : plural(recordings, "live class recording"),
    },
    lessons > 0 && { icon: BookOpen, label: plural(lessons, "lesson") },
    assignments > 0 && {
      icon: ClipboardList,
      label: plural(assignments, "assignment"),
    },
    resources > 0 && { icon: Paperclip, label: "Supporting resources" },
  ].filter(Boolean) as { icon: React.ElementType; label: string }[];

  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-neutral-800">What&apos;s included</p>
      {/* Plain text, so nothing here looks clickable next to the button below. */}
      <ul className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-neutral-500">
        {items.map(({ icon: Icon, label }, index) => (
          <li key={label} className="inline-flex items-center gap-1">
            {index > 0 && (
              <span aria-hidden className="mr-1 text-neutral-300">
                ·
              </span>
            )}
            <Icon className="h-3.5 w-3.5 text-neutral-400" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function moduleActionLabel(topic: CurriculumTopic) {
  const next = topicNextLesson(topic);
  if (countWatched(topic) === 0) return "Start module";
  return next ? `Continue · Lesson ${next.number}` : "Review module";
}

function ModuleProgress({ topic }: { topic: CurriculumTopic }) {
  const total = topic.lessons.length;
  if (total === 0) return null;
  const done = countWatched(topic);
  return (
    <div className="mt-4 flex items-center gap-3">
      <div
        role="progressbar"
        aria-label="Lessons completed"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-1.5 max-w-60 flex-1 overflow-hidden rounded-full bg-neutral-200"
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-[width]"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-neutral-500">
        {done} of {plural(total, "lesson")} done
      </span>
    </div>
  );
}

function ModuleItem({
  topic,
  number,
  defaultOpen,
}: {
  topic: CurriculumTopic;
  number: number;
  defaultOpen: boolean;
}) {
  const unlocked = isUnlocked(topic);
  const [open, setOpen] = useState(defaultOpen && unlocked);
  const title = `${moduleNumber(number)}. ${topic.title}`;

  if (!unlocked) {
    return (
      <li className="flex items-center gap-3 rounded-xl bg-neutral-100 px-4 py-3.5">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-400">
          {title}
        </span>
        <Lock aria-label="Locked" className="h-4 w-4 shrink-0 text-neutral-400" />
      </li>
    );
  }

  return (
    <li className="rounded-xl bg-neutral-100">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          {topic.description && (
            <p className="text-sm text-neutral-500">{topic.description}</p>
          )}
          <Included topic={topic} />
          <ModuleProgress topic={topic} />
          <Link
            href={moduleHref(topic.id)}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-primary px-4 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
          >
            {moduleActionLabel(topic)}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </li>
  );
}

/* The grey panel the design uses for the empty and offline states. */
function StatePanel({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-neutral-100 px-6 py-14 text-center">
      <Icon className="h-5 w-5 text-neutral-500" />
      <p className="mt-3 text-sm font-medium text-neutral-800">{title}</p>
      <p className="mt-1 max-w-[280px] text-xs text-neutral-500">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 rounded-xl bg-neutral-100 p-4">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-7 w-[96px]" />
      </div>
      {[0, 1, 2, 3, 4].map((key) => (
        <Skeleton key={key} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function CurriculumPage() {
  const curriculum = useStudentCurriculum();
  const { enrollment, topics } = curriculum;
  const cohort = curriculum.curricula?.find((item) => item.cohort)?.cohort?.name;
  const openId =
    topics.find((topic) => topic.id === enrollment?.currentTopic?.id)?.id ??
    topics.find(isUnlocked)?.id;

  let body: React.ReactNode;
  if (curriculum.isPending) {
    body = <ListSkeleton />;
  } else if (curriculum.notEnrolled) {
    body = (
      <StatePanel
        icon={BookOpen}
        title="You're not enrolled on a track yet"
        message="Once your program admin enrolls you, your modules will show up here."
      />
    );
  } else if (curriculum.error) {
    body = (
      <StatePanel
        icon={WorriedLeafy}
        title="Couldn't load your curriculum"
        message="Check your internet connection and try again."
      >
        <button
          type="button"
          onClick={() => curriculum.refetch()}
          className="h-8 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
        >
          Try again
        </button>
      </StatePanel>
    );
  } else if (topics.length === 0) {
    body = (
      <StatePanel
        icon={BookOpen}
        title="Your modules will appear here"
        message="Your instructor hasn't published any modules yet. Check back soon."
      />
    );
  } else {
    body = (
      <ul className="flex flex-col gap-2">
        {topics.map((topic, index) => (
          <ModuleItem
            key={topic.id}
            topic={topic}
            number={index + 1}
            defaultOpen={topic.id === openId}
          />
        ))}
      </ul>
    );
  }

  const subtitle = enrollment
    ? [
        enrollment.track.name,
        cohort,
        topics.length > 0 && plural(topics.length, "module"),
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div className="flex max-w-[780px] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium text-neutral-800">Curriculum</h1>
        {subtitle && <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>}
      </div>
      {body}
    </div>
  );
}
