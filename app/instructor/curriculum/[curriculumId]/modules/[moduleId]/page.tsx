"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  FileText,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize, instructorQueries } from "@/lib/instructor";
import { sessionQuery } from "@/lib/session-query";

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

function CardMenu() {
  return (
    <button
      type="button"
      aria-label="More actions"
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors"
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  );
}

export default function ModuleDetailPage() {
  const { curriculumId, moduleId } = useParams<{
    curriculumId: string;
    moduleId: string;
  }>();

  const { data: session, isPending } = useQuery(sessionQuery());
  const user = session?.user;

  const myTracks = useQuery(instructorQueries.myTracks());
  const selectedTrack = myTracks.data?.[0];

  const curriculums = useQuery(
    instructorQueries.curriculums({ trackId: selectedTrack?.trackId })
  );
  const curriculum = curriculums.data?.find((c) => c.id === curriculumId);

  // The API has no "get one topic" endpoint, so find it in the curriculum's list.
  const topics = useQuery(instructorQueries.topics({ curriculumId }));
  const sortedTopics = [...(topics.data ?? [])].sort(
    (a, b) => a.position - b.position
  );
  const topic = sortedTopics.find((t) => t.id === moduleId);
  const moduleIndex = sortedTopics.findIndex((t) => t.id === moduleId);

  const lessons = useQuery(instructorQueries.lessons({ topicId: moduleId }));
  const lessonsData = [...(lessons.data ?? [])].sort(
    (a, b) => a.position - b.position
  );

  // Each query array lines up with lessonsData by index.
  const resourceQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.resources({ lessonId: lesson.id })
    ),
  });
  const assignmentQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.assignments({ lessonId: lesson.id })
    ),
  });
  const recordingQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.recordings({ lessonId: lesson.id })
    ),
  });

  const lessonCards = lessonsData.map((lesson, i) => ({
    ...lesson,
    resources: resourceQueries[i]?.data ?? [],
  }));

  const resourcesData = lessonsData.flatMap((_, i) =>
    resourceQueries[i]?.data ?? []
  );

  const assignmentsData = lessonsData.flatMap((_, i) =>
    assignmentQueries[i]?.data ?? []
  );

  const recordingsData = lessonsData.flatMap((_, i) =>
    recordingQueries[i]?.data ?? []
  );

  const curriculumActive = curriculum?.status !== "COMPLETED";

  return (
    <div className="w-full min-h-screen bg-neutral-50 p-6 space-y-6 tracking-wide">
      {/* Top actions */}
      <div className="flex justify-end gap-3">
        {/* No status field on topics yet, so this button has no action. */}
        <Button
          variant="secondary"
          className="h-10 px-4 text-sm font-medium rounded-xl cursor-pointer"
        >
          Change Status
        </Button>
        <Link
          href={`/instructor/curriculum/${curriculumId}/modules/${moduleId}/edit`}
        >
          <Button className="h-10 px-4 text-sm font-medium rounded-xl bg-brand-primary text-white shadow-xs cursor-pointer inline-flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5" /> Edit module
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* Main column */}
        <div className="space-y-6">
          <section className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-neutral-800 tracking-tight">
                {topic?.title ?? "Module"}
              </h1>
              {/* Topics have no status in the API yet, so this is fixed. */}
              <Badge
                variant="light"
                className="bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-medium border-0"
              >
                Published
              </Badge>
            </div>
            {topic?.description && (
              <p className="text-sm text-neutral-600 leading-relaxed">
                {topic.description}
              </p>
            )}
          </section>

          {/* Module lessons */}
          <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">
                Module lessons
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {lessonCards.length === 0
                  ? "No lessons are attached to this module yet."
                  : `${plural(lessonCards.length, "lesson")} ${lessonCards.length === 1 ? "is" : "are"
                  } currently attached to this module.`}
              </p>
            </div>

            {lessonCards.map((lesson, i) => (
              <div
                key={lesson.id}
                className="relative rounded-2xl bg-neutral-100 p-5 space-y-2"
              >
                <CardMenu />
                <p className="text-[11px] font-medium text-neutral-500">
                  Lesson {i + 1}
                </p>
                <h3 className="text-base font-semibold text-neutral-800">
                  {lesson.title}
                </h3>
                {lesson.description && (
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {lesson.description}
                  </p>
                )}

                {lesson.resources.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {lesson.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-icon-error" />
                        <span className="font-medium text-neutral-800">
                          {resource.title}
                        </span>
                        <span className="text-neutral-500">
                          {formatFileSize(resource.fileSize)}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Assignments */}
          <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">
                Assignments
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                Add practical exercises that help students apply what they’ve
                learned.
              </p>
            </div>

            {assignmentsData.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No assignments in this module yet.
              </p>
            ) : (
              assignmentsData.map((assignment, i) => (
                <div
                  key={assignment.id}
                  className="relative rounded-2xl bg-neutral-100 p-5 space-y-2"
                >
                  <CardMenu />
                  <p className="text-[11px] font-medium text-neutral-500">
                    {[
                      `Assignment ${i + 1}`,
                      assignment.type,
                      assignment.submissionType,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <h3 className="text-base font-semibold text-neutral-800">
                    {assignment.title}
                  </h3>
                  {assignment.description && (
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {assignment.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">
                Module content
              </h2>
              <Link href="/instructor/curriculum">
                <Button
                  variant="secondary"
                  className="h-9 px-3 text-xs font-medium rounded-lg cursor-pointer"
                >
                  Manage resources
                </Button>
              </Link>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-800">
                Class recording link
              </p>
              {recordingsData.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No class recordings yet.
                </p>
              ) : (
                recordingsData.map((recording) => (
                  <a
                    key={recording.id}
                    href={recording.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    <Link2 className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span className="truncate">{recording.url}</span>
                  </a>
                ))
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-800">
                Supporting resources
              </p>
              {resourcesData.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No resources added yet.
                </p>
              ) : (
                resourcesData.map((recording) => (
                  <a
                    key={recording.id}
                    href={recording.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    <Link2 className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span className="truncate">{recording.url}</span>
                  </a>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl overflow-hidden p-0 gap-0">
            <div className="relative h-48 w-full">
              <Image
                src="/curriculum-header.png"
                alt=""
                fill
                className="object-cover"
              />
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Part of curriculum</span>
                <span
                  className={
                    curriculumActive
                      ? "rounded-full bg-surface-success-badge px-2.5 py-0.5 font-medium text-text-success"
                      : "rounded-full bg-surface-default-badge px-2.5 py-0.5 font-medium text-text-default-badge"
                  }
                >
                  {curriculumActive ? "Active" : "Completed"}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-neutral-800">
                  {curriculum?.title}
                </h2>
                <p className="text-sm text-neutral-500">
                  {selectedTrack?.track.name} · {selectedTrack?.cohort?.name}
                </p>
              </div>

              <div className="rounded-xl bg-neutral-100 p-4 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-neutral-700 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    Module {moduleIndex >= 0 ? moduleIndex + 1 : "—"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {moduleIndex + 1} of {plural(sortedTopics.length, "module")}{" "}
                    in this curriculum.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
                <UserAvatar
                  user={{
                    name: user?.name ?? "Account",
                    avatar: user?.image ?? "/default-avatar.png",
                  }}
                  isLoading={isPending}
                />
                <div>
                  <p className="text-[11px] text-neutral-500">Instructor</p>
                  <p className="text-sm font-semibold text-neutral-800">
                    {user?.name}
                  </p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-5 gap-0">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                  <Calendar className="h-4 w-4" />
                  Curriculum live classes
                </div>
                <span className="rounded-full bg-surface-info-badge px-2.5 py-0.5 text-xs font-medium text-text-info">
                  0 classes
                </span>
              </div>

              <p className="text-sm text-neutral-500 leading-relaxed">
                These live sessions are attached to the curriculum and are
                visible to all students enrolled in the track.
              </p>

              <Button
                variant="secondary"
                className="h-10 px-4 text-sm font-medium rounded-xl cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add live class
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}