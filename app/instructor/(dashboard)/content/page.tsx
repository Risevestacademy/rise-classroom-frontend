"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  ChevronDown,
  FileText,
  Plus,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search } from "@/assets/icons";

export default function Content() {
  const router = useRouter();
  const pathname = usePathname();

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
        <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-xs hover:bg-neutral-100">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-300" />
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
        <Tabs defaultValue="modules">
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
            <EmptyState
              title="No modules yet"
              description="Modules group your lessons and assignments. Start by creating your first module."
              buttonLabel="Create your first module"
            onAction={() =>(router.push(`${pathname}/create?type=modules`))}
            />
          </TabsContent>

          <TabsContent value="lessons" className="mt-4">
            <EmptyState
              title="No lessons yet"
              description="Create your first lesson"
              buttonLabel="Create your first lesson"
            onAction={() =>(router.push(`${pathname}/create?type=lessons`))}
            />
          </TabsContent>

          <TabsContent value="resources" className="mt-4">
            <EmptyState
              title="No resources yet"
              description="Upload slides, documents and links once, then reuse them across lessons."
              buttonLabel="Upload resources"
            onAction={() =>(router.push(`${pathname}/create?type=resources`))}
            />
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