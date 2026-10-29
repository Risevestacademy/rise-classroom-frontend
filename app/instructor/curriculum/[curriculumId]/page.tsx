"use client";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import Image from "next/image";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  BookOpen,
  ChevronDown,
  FileEdit,
  GraduationCap,
  Info,
  Pencil,
  Plus,
} from "lucide-react";

import {
  createNote,
  formatDate,
  instructorKeys,
  instructorQueries,
  updateCurriculum,
  type CurriculumUpdateInput,
} from "@/lib/instructor";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Error } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Field } from "@base-ui/react/field";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { AssignmentsList } from "@/components/instructor-dashboard/AssignmentsList";
import { ModulesList } from "@/components/instructor-dashboard/ModulesList";
import { NotesList } from "@/components/instructor-dashboard/NotesList";
import { ResourcesList } from "@/components/instructor-dashboard/ResourcesList";
import { UserAvatar } from "@/components/UserAvatar";

import { sessionQuery } from "@/lib/session-query";

const BADGE_BASE = "rounded-full px-2.5 py-0.5 text-xs font-medium border-0";

const GREEN = "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100";
const NEUTRAL = "bg-surface-default-badge text-text-default-badge";
const AMBER = "bg-surface-warning-badge text-text-warning";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ONGOING: { label: "Active", className: GREEN },
  COMPLETED: { label: "Completed", className: NEUTRAL },
};

const badgeFor = (
  map: Record<string, { label: string; className: string }>,
  value: string
) => map[value] ?? { label: value, className: NEUTRAL };

export default function Curriculum() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const pathname = usePathname();

  const { data: session, isPending } = useQuery(sessionQuery());
  const user = session?.user;

  const myTracks = useQuery(instructorQueries.myTracks());
  const tracks = myTracks.data ?? [];
  const selectedTrack = tracks[0];
  const selectedCohort = selectedTrack?.cohort;

  const students = useQuery(
    instructorQueries.students({
      trackId: selectedTrack?.trackId,
      cohortId: selectedTrack?.cohortId,
    })
  );
  const studentCount = students.data?.length ?? 0;

  const curriculum = useQuery(
    instructorQueries.curriculumById({ curriculumId: curriculumId})
  );
  const currentCurriculum = curriculum.data;
  const statusBadge = currentCurriculum
    ? badgeFor(STATUS_BADGE, currentCurriculum.status)
    : null;

  const [settings, setSettings] = useState<CurriculumUpdateInput>({
    title: "",
    description: "",
    publishStatus: "DRAFT",
    progressMode: "SEQUENTIAL",
  });

  useEffect(() => {
    if (!currentCurriculum) return;

    setSettings({
      title: currentCurriculum.title,
      description: currentCurriculum.description ?? "",
      publishStatus: currentCurriculum.publishStatus,
      progressMode: currentCurriculum.progressMode,
    });
  }, [currentCurriculum]);

  const updateCurriculumMutation = useMutation({
    mutationFn: (input: CurriculumUpdateInput) =>
      updateCurriculum(curriculumId, input),
    onSuccess: async (updatedCurriculum) => {
      queryClient.setQueryData(
        instructorKeys.curriculumById({ curriculumId }),
        updatedCurriculum
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["instructor", "curriculum"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["instructor", "all-curriculums"],
        }),
      ]);
    },
  });

  const updateSettings = (updates: Partial<CurriculumUpdateInput>) => {
    setSettings((current) => ({ ...current, ...updates }));
    updateCurriculumMutation.reset();
  };

  const topics = useQuery(
    instructorQueries.topics({ curriculumId: curriculumId })
  );

  const topicsData = [...(topics.data ?? [])].sort(
    (a, b) => a.position - b.position
  );

  const lessonQueries = useQueries({
    queries: topicsData.map((topic) =>
      instructorQueries.lessons({ topicId: topic.id })
    ),
  });

  const lessonsData = topicsData.flatMap((topic, topicIndex) =>
    [...(lessonQueries[topicIndex]?.data ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((lesson, lessonIndex) => ({
        ...lesson,
        moduleTitle: topic.title,
        moduleNumber: `Module ${topicIndex + 1}`,
        lessonNumber: lessonIndex + 1,
      }))
  );

  const resourceQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.resources({ lessonId: lesson.id })
    ),
  });
  const resourcesData = lessonsData.flatMap((lesson, i) =>
    (resourceQueries[i]?.data ?? []).map((resource) => ({
      ...resource,
      name: resource.title,
      lessonTitle: lesson.title,
      lessonNumber: lesson.lessonNumber,
      moduleTitle: lesson.moduleTitle,
      moduleNumber: lesson.moduleNumber,
      uploaded: formatDate(resource.createdAt),
    }))
  );

  const assignmentQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.assignments({ lessonId: lesson.id })
    ),
  });
  const assignmentsData = lessonsData.flatMap((lesson, i) =>
    (assignmentQueries[i]?.data ?? []).map((assignment) => ({
      ...assignment,
      lessonTitle: lesson.title,
      lessonNumber: lesson.lessonNumber,
      moduleTitle: lesson.moduleTitle,
      moduleNumber: lesson.moduleNumber,
      afterLesson: `After lesson ${lesson.lessonNumber}`,
      dueDateLabel: formatDate(assignment.dueAt),
    }))
  );

  const recordingQueries = useQueries({
    queries: lessonsData.map((lesson) =>
      instructorQueries.recordings({ lessonId: lesson.id })
    ),
  });

  const notesQuery = useQuery(instructorQueries.notes({ curriculumId }));
  const notesData = (notesQuery.data ?? []).map((note) => {
    const moduleIndex = topicsData.findIndex(
      (topic) => topic.id === note.topicId
    );

    return {
      id: note.id,
      title: note.title,
      owner:
        [note.author?.firstName, note.author?.lastName]
          .filter(Boolean)
          .join(" ") || "Unknown author",
      description: note.body,
      moduleNumber:
        moduleIndex >= 0 ? `Module ${moduleIndex + 1}` : "Curriculum",
      date: formatDate(note.createdAt),
    };
  });

  const totalsByTopic = lessonsData.reduce<
    Record<string, { recordings: number; assignments: number; resources: number }>
  >((acc, lesson, i) => {
    const entry = acc[lesson.topicId] ?? {
      recordings: 0,
      assignments: 0,
      resources: 0,
    };
    entry.recordings += recordingQueries[i]?.data?.length ?? 0;
    entry.assignments += assignmentQueries[i]?.data?.length ?? 0;
    entry.resources += resourceQueries[i]?.data?.length ?? 0;
    acc[lesson.topicId] = entry;
    return acc;
  }, {});

  const modulesData = topicsData.map((topic) => ({
    ...topic,
    included: {
      lessons: topic._count?.lessons ?? 0,
      recordings: totalsByTopic[topic.id]?.recordings ?? 0,
      assignments: totalsByTopic[topic.id]?.assignments ?? 0,
      resources: totalsByTopic[topic.id]?.resources ?? 0,
    },
  }));

  const [activeTab, setActiveTab] = useState("overview");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteTopicId, setNoteTopicId] = useState("");
  const createNoteMutation = useMutation({
    mutationFn: () =>
      createNote(curriculumId, {
        title: noteTitle.trim(),
        body: noteBody.trim(),
        ...(noteTopicId ? { topicId: noteTopicId } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: instructorKeys.notes({ curriculumId }),
      });
      setNoteTitle("");
      setNoteBody("");
      setNoteTopicId("");
      setIsAddNoteOpen(false);
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  const filteredAssignments = assignmentsData.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResources = resourcesData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAssignmentRow = (id: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllAssignments = () => {
    if (selectedAssignmentIds.length === filteredAssignments.length) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(filteredAssignments.map((item) => item.id));
    }
  };

  const toggleResourceRow = (id: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllResources = () => {
    if (selectedResourceIds.length === filteredResources.length) {
      setSelectedResourceIds([]);
    } else {
      setSelectedResourceIds(filteredResources.map((item) => item.id));
    }
  };

  const getTabButtonConfig = () => {
    switch (activeTab) {
      case "modules":
        return topicsData.length > 0 && curriculumId
          ? { label: "Add Module", onClick: () => router.push(`/instructor/curriculum/${curriculumId}/modules/create`) }
          : null;
      case "assignments":
        return assignmentsData.length > 0 && curriculumId
          ? { label: "Add Assignment", onClick: () => router.push(`/instructor/curriculum/${curriculumId}/assignments/create`) }
          : null;
      case "resources":
        return resourcesData.length > 0 && curriculumId
          ? { label: "Add Resource", onClick: () => router.push(`/instructor/curriculum/${curriculumId}/resources/create`) }
          : null;
      case "notes":
        return notesData.length > 0 && curriculumId
          ? { label: "Add Note", onClick: () => setIsAddNoteOpen(true) }
          : null ;
      default:
        return null;
    }
  };

  const buttonConfig = getTabButtonConfig();

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Curriculum", href: "/instructor/curriculum" }, { label: currentCurriculum?.title ?? ".....", href: pathname}]} />
      <main className="flex flex-col min-h-screen bg-neutral-100 p-6 space-y-6">
        <div className="img-header relative w-full h-16 md:h-20 overflow-hidden rounded-xl">
          <Image
            src="/curriculum-header.png"
            alt="Curriculum Header"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="header flex flex-col md:flex-row justify-between">
          <div className="left">
            <div className="title flex flex-row space-x-6">
              <h1 className="text-2xl font-semibold text-neutral-800 tracking-tight">
                {currentCurriculum?.title}
              </h1>
              {statusBadge && (
                <Badge
                  variant="light"
                  className={`${BADGE_BASE} ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </Badge>
              )}
            </div>
            <div className="subtitle text-xs font-medium text-neutral-500 mt-1">
              <p className="tracking-wide">{selectedTrack?.track.name} · {selectedCohort?.name}</p>
            </div>

            <div className="flex items-center gap-8 mt-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-900">
                  <BookOpen size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Total modules</p>
                  <p className="text-sm font-bold text-neutral-800">{topicsData.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-900">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Total Lessons</p>
                  <p className="text-sm font-bold text-neutral-800">{lessonsData.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-900">
                  <FileEdit size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Total Assignments</p>
                  <p className="text-sm font-bold text-neutral-900">{assignmentsData.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="right text-xs font-regular flex flex-col items-end text-right">
            <UserAvatar
              user={{
                name: user?.name ?? "Account",
                avatar: user?.image ?? "/default-avatar.png",
              }}
              isLoading={isPending}
            />
            <p>Instructor: {user?.name}</p>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <div className="flex items-center justify-between w-full">
              <TabsList className="bg-neutral-200 px-2 py-1 !h-auto rounded-lg gap-1 inline-flex shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)]">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="modules"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
                >
                  Modules
                </TabsTrigger>
                <TabsTrigger
                  value="assignments"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
                >
                  Assignments
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
                >
                  Resources
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900"
                >
                  Notes
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
              {buttonConfig && (
                <button
                  onClick={buttonConfig.onClick}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary-hover cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  <span>{buttonConfig.label}</span>
                </button>
              )}
            </div>

            <TabsContent value="overview" className="w-[500px] space-y-8 outline-none">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-lg font-bold text-neutral-900">
                  About this curriculum
                </h2>
                <p className="text-sm text-neutral-500 leading-relaxed tracking-wider">
                  {currentCurriculum?.description}
                </p>
              </div>

              <Card className="max-w-[270px] bg-neutral-200 border-none ring-0 shadow-none rounded-2xl p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-base font-bold text-neutral-900">
                    Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 text-indigo-950">
                      <Pencil size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">
                        {selectedTrack?.track.name} · {selectedCohort?.name}
                      </p>
                      <p className="text-xs font-medium text-neutral-500">
                        {studentCount} Students
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="space-y-4 outline-none">
              {topicsData.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No module yet"
                  description="Modules group your lessons and assignments. Start by creating your first module."
                  button={curriculumId ? {
                    label: "Add Module",
                    onClick: () => router.push(`/instructor/curriculum/${curriculumId}/modules/create`),
                  } : undefined}
                />
              ) : (
                <ModulesList modules={modulesData} />
              )}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 outline-none mt-0">
              {assignmentsData.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Assignment yet"
                  description="Add your first and attach to a lesson in a module for students."
                  button={curriculumId ? {
                    label: "Add Assignment",
                    onClick: () => router.push(`/instructor/curriculum/${curriculumId}/assignments/create`),
                  } : undefined}
                />
              ) : (
                <AssignmentsList
                  assignments={filteredAssignments}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  selectedIds={selectedAssignmentIds}
                  onToggleSelectRow={toggleAssignmentRow}
                  onToggleSelectAll={toggleAllAssignments}
                />
              )}
            </TabsContent>

            <TabsContent value="resources">
              {resourcesData.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No resource yet"
                  description="Add your first resource and attach to a lesson in a module for students."
                  button={curriculumId ? {
                    label: "Add Resource",
                    onClick: () => router.push(`/instructor/curriculum/${curriculumId}/resources/create`),
                  } : undefined}
                />
              ) : (
                <ResourcesList
                  resources={filteredResources}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  selectedIds={selectedResourceIds}
                  onToggleSelectRow={toggleResourceRow}
                  onToggleSelectAll={toggleAllResources}
                />
              )}
            </TabsContent>

            <TabsContent value="notes">
              {notesData.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No notes yet"
                  description="Add your first note. All notes are visible only to admins and assigned instructors"
                  button={{
                    label: "Add Note",
                    onClick: () => {
                      setIsAddNoteOpen(true);
                    },
                  }}
                />
              ) : (
                <NotesList
                  notes={notesData}
                />
              )}
            </TabsContent>

            <TabsContent value="settings" className="w-full flex flex-col space-y-6">
              <div className="mb-2">
                <h1 className="text-[24px] font-semibold mb-[4px]">
                  Settings
                </h1>
                <p className="text-[14px] font-regular text-neutral-500">
                  Manage how this curriculum is configured and delivered
                </p>
              </div>

              <div className="flex flex-row gap-6 w-full items-start">
                <form
                  className="w-full md:w-[70%] space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateCurriculumMutation.mutate(settings);
                  }}
                >
                  <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="text-[18px] font-semibold">
                        General
                      </CardTitle>
                      <CardDescription className="text-[14px] font-regular tracking-wide text-neutral-500">
                        Basic information about the curriculum
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-4">
                        <Field.Root className="flex flex-col space-y-1.5">
                          <Field.Label className="text-xs font-medium text-text-primary">
                            Curriculum name <span className="text-red-500">*</span>
                          </Field.Label>
                          <Input
                            placeholder="Type curriculum name..."
                            value={settings.title}
                            onChange={(event) =>
                              updateSettings({ title: event.target.value })
                            }
                            required
                          />
                          <Error className="text-xs text-error-text"></Error>
                        </Field.Root>

                        <Field.Root className="flex flex-col space-y-1.5">
                          <Field.Label className="text-xs font-medium text-text-primary">
                            Description <span className="text-neutral-400 font-normal">(Optional)</span>
                          </Field.Label>
                          <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800"
                            value={settings.description}
                            onChange={(event) =>
                              updateSettings({ description: event.target.value })
                            }
                          />
                          <Error className="text-xs text-error-text"></Error>
                        </Field.Root>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="text-[18px] font-semibold">
                        Delivery settings
                      </CardTitle>
                      <CardDescription className="text-[14px] font-regular tracking-wide text-neutral-500">
                        Control how students access and progress
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-800">Curriculum status</p>

                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={settings.publishStatus === "PUBLISHED"}
                            onChange={() =>
                              updateSettings({ publishStatus: "PUBLISHED" })
                            }
                            className="mt-0.5 accent-brand-primary"
                          />
                          <div>
                            <p className="text-xs font-semibold text-neutral-800">Published</p>
                            <p className="text-[11px] text-neutral-500">Student can access this Curriculum</p>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={settings.publishStatus === "DRAFT"}
                            onChange={() =>
                              updateSettings({ publishStatus: "DRAFT" })
                            }
                            className="mt-0.5 accent-brand-primary"
                          />
                          <div>
                            <p className="text-xs font-semibold text-neutral-800">Draft</p>
                            <p className="text-[11px] text-neutral-500">Only admin and instructors can view this curriculum</p>
                          </div>
                        </label>
                      </div>

                      <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-800">Progress mode</p>

                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="progress"
                            checked={settings.progressMode === "SEQUENTIAL"}
                            onChange={() =>
                              updateSettings({ progressMode: "SEQUENTIAL" })
                            }
                            className="mt-0.5 accent-brand-primary"
                          />
                          <div>
                            <p className="text-xs font-semibold text-neutral-800">Sequential</p>
                            <p className="text-[11px] text-neutral-500">Student complete modules in order</p>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="progress"
                            checked={settings.progressMode === "FLEXIBLE"}
                            onChange={() =>
                              updateSettings({ progressMode: "FLEXIBLE" })
                            }
                            className="mt-0.5 accent-brand-primary"
                          />
                          <div>
                            <p className="text-xs font-semibold text-neutral-800">Flexible</p>
                            <p className="text-[11px] text-neutral-500">Students can access available modules freely</p>
                          </div>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-2">
                    {/* {updateCurriculumMutation.isError && (
                      <p role="alert" className="text-sm text-error-text">
                        {updateCurriculumMutation.error.message}
                      </p>
                    )}
                    {updateCurriculumMutation.isSuccess && (
                      <p role="status" className="text-sm text-emerald-700">
                        Changes saved.
                      </p>
                    )} */}
                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={updateCurriculumMutation.isPending}
                        className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover rounded-xl px-4 py-2 text-xs font-medium"
                      >
                        {updateCurriculumMutation.isPending
                          ? "Saving..."
                          : "Save changes"}
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="w-[30%] hidden md:block">
                  <Card className="max-w-[270px] bg-[#F5F6FF] border-none ring-0 shadow-none rounded-2xl p-4">
                    <CardHeader className="p-0 mb-2">
                      <CardTitle className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                        <Info size={16} className="text-neutral-700" />
                        <span>Version history</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2">
                      <p className="text-xs text-neutral-500 leading-snug">
                        Aishat Lawal changed module access to Sequential
                      </p>
                      <p className="text-[11px] text-neutral-400 font-medium">
                        Oct 8, 2026
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog
          open={isAddNoteOpen}
          onOpenChange={(open) => {
            setIsAddNoteOpen(open);
            if (open) {
              createNoteMutation.reset();
            } else if (!createNoteMutation.isPending) {
              setNoteTitle("");
              setNoteBody("");
              setNoteTopicId("");
              createNoteMutation.reset();
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Add an internal note about this curriculum
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4 mt-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (!noteTitle.trim() || !noteBody.trim()) return;
                createNoteMutation.mutate();
              }}
            >
              <Field.Root className="flex flex-col space-y-1.5">
                <Field.Label className="text-xs font-medium text-text-primary">
                  Title <span className="text-red-500">*</span>
                </Field.Label>
                <Input
                  placeholder="Type curriculum note title..."
                  leadingIcon={null}
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                  required
                />
              </Field.Root>

              <Field.Root className="flex flex-col space-y-1.5">
                <Field.Label className="text-xs font-medium text-text-primary">
                  Note <span className="text-red-500">*</span>
                </Field.Label>
                <textarea
                  value={noteBody}
                  onChange={(event) => setNoteBody(event.target.value)}
                  required
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800"
                />
              </Field.Root>

              <Field.Root className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-800">
                  Attach to
                </label>
                <div className="relative">
                  <select
                    value={noteTopicId}
                    onChange={(event) => setNoteTopicId(event.target.value)}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="">Curriculum (no module)</option>
                    {topicsData.map((topic, i) => (
                      <option key={topic.id} value={topic.id}>
                        Module {i + 1} - {topic.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                </div>
              </Field.Root>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddNoteOpen(false)}
                  disabled={createNoteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createNoteMutation.isPending ||
                    !noteTitle.trim() ||
                    !noteBody.trim()
                  }
                >
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  button?: {
    label: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  button,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-[16px]">
        <Icon className="h-[80px] w-[80px] text-brand-primary" />
      </div>
      <h3 className="text-[24px] font-semibold text-neutral-800">{title}</h3>
      <p className="text-[14px] font-regular text-neutral-500 max-w-sm tracking-wider">{description}</p>

      {button && (
        <button
          onClick={button.onClick}
          className="mt-[24px] inline-flex items-center gap-2 rounded-lg px-[16px] py-[10px] text-xs font-medium text-white bg-brand-primary cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-white" />
          <span>{button.label}</span>
        </button>
      )}
    </div>
  );
}