"use client";

import { useState } from "react";

import Image from "next/image";

import {
  BookOpen,
  FileEdit,
  GraduationCap,
  Info,
  Pencil,
  Plus,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";

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

import { AssignmentsList } from "@/components/instructor-dashboard/AssignmentsList";
import {
  assignmentsData,
  modulesData,
  resourcesData,
  notesData
} from "@/components/instructor-dashboard/data";
import { ModulesList } from "@/components/instructor-dashboard/ModulesList";
import { ResourcesList } from "@/components/instructor-dashboard/ResourcesList";
import { NotesList } from "@/components/instructor-dashboard/NotesList";
import { UserAvatar } from "@/components/UserAvatar";

import { sessionQuery } from "@/lib/session-query";

export default function Curriculum() {
  const { data: session, isPending } = useQuery(sessionQuery());
  const user = session?.user;

  const [activeTab, setActiveTab] = useState("overview");

  const assignments = assignmentsData;
  const resources = resourcesData;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  const filteredAssignments = assignments.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResources = resources.filter((item) =>
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
        return modulesData.length > 0
          ? { label: "Add Module", onClick: () => console.log("Add Module") }
          : null;
      case "assignments":
        return assignments.length > 0
          ? { label: "Add Assignment", onClick: () => console.log("Add Assignment") }
          : null;
      case "resources":
        return resources.length > 0
          ? { label: "Add Resource", onClick: () => console.log("Add Resource") }
          : null;
      case "notes":
        return { label: "Add Note", onClick: () => console.log("Add Note") };
      default:
        return null;
    }
  };

  const buttonConfig = getTabButtonConfig();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 p-6 space-y-6">
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
              Design Track Curriculum
            </h1>
            <Badge
              variant="light"
              className="bg-emerald-100/70 text-emerald-700 hover:bg-emerald-100 rounded-full px-2.5 py-0.5 text-xs font-medium border-0"
            >
              Active
            </Badge>
          </div>
          <div className="subtitle text-xs font-medium text-neutral-500 mt-1">
            <p className="tracking-wide">Design · Cohort 2026</p>
          </div>

          <div className="flex items-center gap-8 mt-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-900">
                <BookOpen size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">Total modules</p>
                <p className="text-sm font-bold text-neutral-900">0</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-900">
                <GraduationCap size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">Total Lessons</p>
                <p className="text-sm font-bold text-neutral-900">0</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-900">
                <FileEdit size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">Total Assignments</p>
                <p className="text-sm font-bold text-neutral-900">0</p>
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
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary-hovercursor-pointer shadow-xs"
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
                This curriculum is designed to help students build a strong foundation
                in product and ux design. It covers the full design process from research
                and ideation to prototyping and design systems.
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
                      Design · Cohort 2026
                    </p>
                    <p className="text-xs font-medium text-neutral-500">
                      16 Students
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="modules" className="space-y-4 max-w-4xl outline-none">
            {modulesData.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No module yet"
                description="Modules group your lessons and assignments. Start by creating your first module."
                button={{
                  label: "Add Module",
                  onClick: () => {
                    console.log("Add Module");
                  },
                }}
              />
            ) : (
                <ModulesList modules={modulesData} />
            )}
          </TabsContent>
          <TabsContent value="assignments" className="space-y-4 outline-none mt-0">
            {assignments.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Assignment yet"
                description="Add your first and attach to a lesson in a module for students."
                button={{
                  label: "Add Assignment",
                  onClick: () => {
                    console.log("Add Assignment");
                  },
                }}
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
            {resources.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No resource yet"
              description="Add your first resource and attach to a lesson in a module for students."
              button={{
                label: "Add Resource",
                onClick: () => {

                },
              }}
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
              <div className="w-full md:w-[70%] space-y-4">
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
                        <Input defaultValue="Design Track Curriculum" placeholder="Type curriculum name..." />
                        <Error className="text-xs text-error-text"></Error>
                      </Field.Root>

                      <Field.Root className="flex flex-col space-y-1.5">
                        <Field.Label className="text-xs font-medium text-text-primary">
                          Description <span className="text-neutral-400 font-normal">(Optional)</span>
                        </Field.Label>
                        <textarea
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800"
                          defaultValue="This curriculum is designed to help students build a strong foundation in product and ux design. It covers the full design process from research and ideation to prototyping and design systems."
                        />
                        <Error className="text-xs text-error-text"></Error>
                      </Field.Root>

                      <div className="flex justify-end pt-2">
                        <Button type="button" className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover rounded-xl px-4 py-2 text-xs font-medium">
                          Save changes
                        </Button>
                      </div>
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
                        <input type="radio" name="status" defaultChecked className="mt-0.5 accent-brand-primary" />
                        <div>
                          <p className="text-xs font-semibold text-neutral-800">Published</p>
                          <p className="text-[11px] text-neutral-500">Student can access this Curriculum</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input type="radio" name="status" className="mt-0.5 accent-brand-primary" />
                        <div>
                          <p className="text-xs font-semibold text-neutral-800">Draft</p>
                          <p className="text-[11px] text-neutral-500">Only admin and instructors can view this curriculum</p>
                        </div>
                      </label>
                    </div>

                    <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-800">Progress mode</p>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input type="radio" name="progress" defaultChecked className="mt-0.5 accent-brand-primary" />
                        <div>
                          <p className="text-xs font-semibold text-neutral-800">Sequential</p>
                          <p className="text-[11px] text-neutral-500">Student complete modules in order</p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input type="radio" name="progress" className="mt-0.5 accent-brand-primary" />
                        <div>
                          <p className="text-xs font-semibold text-neutral-800">Flexible</p>
                          <p className="text-[11px] text-neutral-500">Students can access available modules freely</p>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
    </div>
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
  const ButtonIcon = button?.icon;

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