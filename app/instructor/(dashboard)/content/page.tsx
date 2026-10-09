"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  FileText,
  Plus,
  Calendar,
  Play,
  Link2,
  FileEdit,
  CheckCircle2,
  Clock,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search } from "@/assets/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const modulesData = [
  {
    id: 1,
    title: "Introduction",
    description: "What UX is and why it matters",
    lessons: 4,
    resources: 6,
    assignments: 2,
    status: "Published",
  },
  {
    id: 2,
    title: "User Research",
    description: "Planning and running research",
    lessons: 4,
    resources: 5,
    assignments: 3,
    status: "Published",
  },
  {
    id: 3,
    title: "Design thinking",
    description: "Framing problems and generating ideas",
    lessons: 4,
    resources: 6,
    assignments: 2,
    status: "Draft",
  },
  {
    id: 4,
    title: "Prototyping",
    description: "From sketches to testable prototypes",
    lessons: 0,
    resources: 0,
    assignments: 0,
    status: "Not started",
  },
];

export const lessonsData = [
  {
    id: 1,
    title: "Introduction",
    lessonsCount: 3,
    lessons: [
      {
        id: "les-101",
        title: "Lesson 1 • What is UX?",
        type: "Video lesson",
        duration: "24m",
        recordingStatus: "Ready",
        resourcesCount: 6,
        assignmentsCount: 2,
        status: "Published",
      },
      {
        id: "les-102",
        title: "Lesson 2 • UX in the real world",
        type: "Video lesson",
        duration: "24m",
        recordingStatus: "Ready",
        resourcesCount: 6,
        assignmentsCount: 2,
        status: "Published",
      },
      {
        id: "les-103",
        title: "Lesson 3 • Tools of the trade",
        type: "Video lesson",
        duration: "24m",
        recordingStatus: "Ready",
        resourcesCount: 6,
        assignmentsCount: 2,
        status: "Published",
      },
    ],
  },
  {
    id: 2,
    title: "User Research",
    lessonsCount: 3,
    lessons: [
      {
        id: "les-201",
        title: "Lesson 1 • Intro to User Research",
        type: "Video lesson",
        duration: "24m",
        recordingStatus: "Ready",
        resourcesCount: 6,
        assignmentsCount: 2,
        status: "Published",
      },
      {
        id: "les-202",
        title: "Lesson 2 • Planning research",
        type: "Video lesson",
        duration: "24m",
        recordingStatus: "Ready",
        resourcesCount: 6,
        assignmentsCount: 2,
        status: "Published",
      },
      {
        id: "les-203",
        title: "Lesson 3 • Choosing methods",
        type: "Video lesson",
        duration: "24m",
        recordingStatus: "Ready",
        resourcesCount: 6,
        assignmentsCount: 2,
        status: "Published",
      },
    ],
  },
  {
    id: 3,
    title: "Design thinking",
    lessonsCount: 3,
    lessons: [
      {
        id: "les-301",
        title: "Lesson 1 • Problem Definition",
        type: "Video lesson",
        duration: "18m",
        recordingStatus: "Ready",
        resourcesCount: 4,
        assignmentsCount: 1,
        status: "Published",
      },
      {
        id: "les-302",
        title: "Lesson 2 • Ideation Techniques",
        type: "Video lesson",
        duration: "30m",
        recordingStatus: "Ready",
        resourcesCount: 5,
        assignmentsCount: 2,
        status: "Draft",
      },
      {
        id: "les-303",
        title: "Lesson 3 • Affinity Mapping",
        type: "Video lesson",
        duration: "22m",
        recordingStatus: "Pending",
        resourcesCount: 2,
        assignmentsCount: 1,
        status: "Draft",
      },
    ],
  },
  {
    id: 4,
    title: "Prototyping",
    lessonsCount: 0,
    lessons: [],
  },
];

export const resourcesData = [
  {
    id: 1,
    moduleTitle: "Introduction",
    resourcesCount: 6,
    sections: [
      {
        sectionTitle: "LESSON 1 • WHAT IS UX?",
        resources: [
          {
            id: "res-102",
            name: "Intro slides.pptx",
            type: "PPT",
            sizeOrDomain: "2.4MB",
          },
          {
            id: "res-103",
            name: "UX glossary",
            type: "LINK",
            sizeOrDomain: "uxdesign.cc",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    moduleTitle: "User Research",
    resourcesCount: 3,
    sections: [],
  },
  {
    id: 3,
    moduleTitle: "Design thinking",
    resourcesCount: 3,
    sections: [],
  },
  {
    id: 4,
    moduleTitle: "Prototyping",
    resourcesCount: 0,
    sections: [],
  },
];

function StatusBadge({ status }) {
  const isPublished = status === "Published";
  const isDraft = status === "Draft";

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium shadow-none",
        isPublished && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        isDraft && "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        status === "Not started" && "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50"
      )}
    >
      {isPublished && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
      {isDraft && <Clock className="w-3 h-3 text-amber-600" />}
      {status === "Not started" && <Clock className="w-3 h-3 text-slate-400" />}
      {status}
    </Badge>
  );
}

export default function Content() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = React.useState("modules");

  return (
    <div className="flex flex-col bg-neutral-50 p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">
            Content
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Manage your modules, lessons and resources
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-[#0B132B] text-white px-3 py-1.5 text-sm text-neutral-600 shadow-xs" onClick={() => (router.push(`${pathname}/create?type=${activeTab}`))}>
          <Plus className="w-3.5 h-3.5" />
          {activeTab === "modules" && "Create Module"}
            {activeTab === "lessons" && "Create Lesson"}
            {activeTab === "resources" && "Create Resource"}
        </button>
      </div>

      <div className=" flex flex-row h-10 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-neutral-300 md:flex md:w-48 lg:w-64">
        <Search />
        <input
          type="search"
          placeholder="Search tracks"
          className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-300 focus:outline-none"
        />
      </div>

      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="h-auto gap-8 bg-transparent p-0 justify-start rounded-none">
            <TabsTrigger
              value="modules"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-400 shadow-none transition-none hover:text-neutral-800 data-[state=active]:bg-transparent data-[state=active]:text-neutral-800 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-primary after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Modules
            </TabsTrigger>
            <TabsTrigger
              value="lessons"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-400 shadow-none transition-none hover:text-neutral-800 data-[state=active]:bg-transparent data-[state=active]:text-neutral-800 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-primary after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Lessons
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-400 shadow-none transition-none hover:text-neutral-800 data-[state=active]:bg-transparent data-[state=active]:text-neutral-800 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-primary after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-8">
            {modulesData && modulesData.length > 0 ? (
              <ModulesTable data={modulesData} />
            ) : (
              <EmptyState
                title="No modules yet"
                description="Modules group your lessons and assignments. Start by creating your first module."
                buttonLabel="Create your first module"
                onAction={() => router.push(`${pathname}/create?type=modules`)}
              />
            )}
          </TabsContent>

          <TabsContent value="lessons" className="mt-4">
            {lessonsData && lessonsData.length > 0 ? (
              <LessonsTable data={lessonsData} />
            ) : (
              <EmptyState
                title="No lessons yet"
                description="Create your first lesson"
                buttonLabel="Create your first lesson"
                onAction={() => (router.push(`${pathname}/create?type=lessons`))}
              />
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-4">
            {resourcesData && resourcesData.length > 0 ? (
              <ResourcesTable data={resourcesData} />
            ) : (
            <EmptyState
              title="No resources yet"
              description="Upload slides, documents and links once, then reuse them across lessons."
              buttonLabel="Upload resources"
              onAction={() => (router.push(`${pathname}/create?type=resources`))}
            />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  buttonLabel: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

function EmptyState({
  title,
  description,
  buttonLabel,
  onAction,
  icon: Icon = FileText,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-xs">
        <Icon className="h-10 w-10 text-brand-primary" />
      </div>
      <h3 className="text-base font-bold text-neutral-800">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-neutral-400">{description}</p>
      <Button
        onClick={onAction}
        className="mt-6 gap-2 rounded-md bg-brand-primary px-5 text-xs text-neutral-0 hover:bg-interactive-primary-hover cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>{buttonLabel}</span>
      </Button>
    </div>
  );
}

function ModulesTable() {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-brand-50/50 rounded-xl border border-slate-100 shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="w-[45%] text-xs font-semibold uppercase tracking-wider text-slate-400">
              Module
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Lessons
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Resources
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Assignments
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-right pr-6">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modulesData.map((item) => (
            <TableRow
              key={item.id}
              className="border-b border-slate-100/80 hover:bg-slate-100/50 transition-colors"
            >
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 shrink-0">
                    {item.id}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.description}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center font-medium text-slate-700">
                <div className="inline-flex items-center justify-center gap-1.5">
                  <Play className="w-4 h-4 text-slate-700 fill-slate-700/20" />
                  <span>{item.lessons}</span>
                </div>
              </TableCell>

              <TableCell className="text-center font-medium text-slate-700">
                <div className="inline-flex items-center justify-center gap-1.5">
                  <Link2 className="w-4 h-4 text-slate-700" />
                  <span>{item.resources}</span>
                </div>
              </TableCell>

              <TableCell className="text-center font-medium text-slate-700">
                <div className="inline-flex items-center justify-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-slate-700" />
                  <span>{item.assignments}</span>
                </div>
              </TableCell>

              <TableCell className="text-right pr-6">
                <StatusBadge status={item.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LessonsTable() {
  const [openModuleIds, setOpenModuleIds] = React.useState<number[]>(
    lessonsData.map((m) => m.id)
  );

  const toggleModule = (id: number) => {
    setOpenModuleIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full mx-auto p-4 bg-slate-50/50 rounded-xl border border-slate-100">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-200 hover:bg-transparent">
            <TableHead className="w-[40%] text-xs font-semibold uppercase tracking-wider text-slate-400">
              Module
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Recording
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Resources
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Assignments
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-right pr-4">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {lessonsData.map((module) => {
            const isOpen = openModuleIds.includes(module.id);

            return (
              <React.Fragment key={module.id}>

                <TableRow className="bg-[#0B132B] hover:bg-[#0F1A3A] border-none transition-colors">
                  <TableCell colSpan={5} className="py-2.5 px-4 rounded-md">
                    <div className="flex items-center justify-between text-white" onClick={() => toggleModule(module.id)}>
                      <span>
                        MODULE {module.id} • {module.title} • {module.lessonsCount} lessons
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Add lesson to module", module.id);
                        }}
                        className="h-8 bg-white hover:bg-slate-100 text-slate-900 border-none font-medium text-xs gap-1 rounded-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add lesson
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {!isOpen &&
                  module.lessons.map((lesson) => (
                    <TableRow
                      key={lesson.id}
                      className="border-b border-slate-100 hover:bg-slate-100/50 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col pl-6">
                          <span className="text-sm font-semibold text-slate-900">
                            {lesson.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {lesson.type} • {lesson.duration}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {lesson.recordingStatus}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5 font-medium text-slate-700 text-sm">
                          <Link2 className="w-4 h-4 text-slate-700" />
                          <span>{lesson.resourcesCount}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5 font-medium text-slate-700 text-sm">
                          <FileEdit className="w-4 h-4 text-slate-700" />
                          <span>{lesson.assignmentsCount}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-4">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-none ${lesson.status === "Published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                            }`}
                        >
                          • {lesson.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}

                <TableRow className="h-2 hover:bg-transparent border-none">
                  <TableCell colSpan={5} className="p-0" />
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const resourceTypeConfig = {
  PDF: {
    label: "PDF",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    icon: FileText,
  },
  PPT: {
    label: "PPT",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    icon: Presentation,
  },
  LINK: {
    label: "LINK",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    icon: Link2,
  },
  DOC: {
    label: "DOC",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: File,
  },
};

function ResourceTypeBadge({ type }: { type: ResourceItem["type"] }) {
  const config = resourceTypeConfig[type] || resourceTypeConfig.DOC;

  return (
    <div
      className={`flex h-10 w-12 flex-col items-center justify-center rounded-lg border text-[10px] font-bold tracking-wider shrink-0 ${config.badgeClass}`}
    >
      {config.label}
    </div>
  );
}

function ResourcesTable() {
  const [openModuleIds, setOpenModuleIds] = React.useState<number[]>(
    resourcesData.map((m) => m.id)
  );

  const toggleModule = (id: number) => {
    setOpenModuleIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full mx-auto space-y-3">
      {resourcesData.map((module) => {
        const isOpen = openModuleIds.includes(module.id);
        const hasSections = module.sections && module.sections.length > 0;

        return (
          <div
            key={module.id}
            onClick={() => toggleModule(module.id)}
            className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden"
          >
            <div className="bg-[#0B132B] px-4 py-2.5 flex items-center justify-between text-white">
                <span>
                  MODULE {module.id} • {module.moduleTitle} • {module.resourcesCount} resources
                </span>

              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Add resource to module", module.id);
                }}
                className="h-8 bg-white hover:bg-slate-100 text-slate-900 border-none font-medium text-xs gap-1 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Add resource
              </Button>
            </div>

            {!isOpen && (
              <div className="divide-y divide-slate-100">
                {!hasSections ? (
                  <div className="p-4 text-xs text-slate-400 italic">
                    No resources added to this module yet.
                  </div>
                ) : (
                  module.sections.map((section, sIdx) => (
                    <div key={sIdx} className="p-4 space-y-3">
                      <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                        {section.sectionTitle}
                      </div>

                      <div className="space-y-2">
                        {section.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/80 transition-colors"
                          >
                            <ResourceTypeBadge type={resource.type} />

                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900">
                                {resource.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {resource.type} • {resource.sizeOrDomain}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}