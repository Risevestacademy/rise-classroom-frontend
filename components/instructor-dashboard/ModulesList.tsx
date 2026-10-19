"use client";

import { useState } from "react";
import {
  Book,
  ChevronDown,
  ChevronUp,
  FileText,
  Folder,
  GripVertical,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ModuleItem } from "@/components/instructor-dashboard/data";

export function ModulesList({ modules }: { modules: ModuleItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return modules.map((mod) => {
    const isOpen = expandedId === mod.id;

    return (
      <div key={mod.id} className="flex items-center gap-3">
        <GripVertical
          className="text-neutral-400 cursor-grab shrink-0 self-start mt-6"
          size={18}
        />
        <div className="flex-1 bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 transition-all">
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-neutral-900">
                {mod.number}. {mod.title}
              </h3>
              <Badge
                variant="secondary"
                className={
                  mod.status === "Published"
                    ? "bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-medium border-0"
                    : "bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-0.5 text-xs font-medium border-0"
                }
              >
                {mod.status}
              </Badge>
            </div>
            <button
              className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 transition-colors"
              onClick={() => setExpandedId(isOpen ? null : mod.id)}
            >
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {isOpen && (
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
              <p className="text-sm text-neutral-500 leading-relaxed">
                {mod.description}
              </p>
              <div>
                <p className="text-xs font-semibold text-neutral-800 mb-2">
                  What’s Included
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                  <span className="flex items-center gap-1.5">
                    <Video size={14} className="text-neutral-500" />{" "}
                    {mod.included.recordings} Live class recording
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Book size={14} className="text-neutral-500" />{" "}
                    {mod.included.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-neutral-500" />{" "}
                    {mod.included.assignments} assignment
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Folder size={14} className="text-neutral-500" />{" "}
                    {mod.included.resources} Other supporting resources
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });
}
