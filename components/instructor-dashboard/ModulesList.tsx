"use client";

import {
  Book,
  ChevronDown,
  ChevronUp,
  FileText,
  Folder,
  GripVertical,
  Video,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { TopicRecord } from "@/lib/instructor";

export type ModuleRow = TopicRecord & {
  included: {
    recordings: number;
    lessons: number;
    assignments: number;
    resources: number;
  };
};

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

const BADGE_BASE = "rounded-full px-2.5 py-0.5 text-xs font-medium border-0";

const GREEN = "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100";
const NEUTRAL = "bg-surface-default-badge text-text-default-badge";
const AMBER = "bg-surface-warning-badge text-text-warning";

const PUBLISH_BADGE: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "Published", className: GREEN },
  DRAFT: { label: "Draft", className: AMBER },
};

const badgeFor = (
  map: Record<string, { label: string; className: string }>,
  value: string
) => map[value] ?? { label: value, className: NEUTRAL };

export function ModulesList({ modules }: { modules: ModuleRow[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasIncluded = (mod: ModuleRow) =>
    mod.included.recordings > 0 ||
    mod.included.lessons > 0 ||
    mod.included.assignments > 0 ||
    mod.included.resources > 0;

  return (
    <>
      {modules.map((mod) => {
        const isOpen = expandedId === mod.id;
        const publishBadge = badgeFor(PUBLISH_BADGE, mod.publishStatus);

        return (
          <div key={mod.id} className="flex items-center gap-3 max-w-4xl">
            <GripVertical
              className="text-neutral-400 cursor-grab shrink-0 self-start mt-6"
              size={18}
            />
            <div className="flex-1 bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 transition-all">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  router.push(`${pathname}/modules/${mod.id}`)
                }
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-neutral-800">
                    {String(mod.position + 1).padStart(2, "0")} · {mod.title}
                  </h3>
                  <Badge
                    variant="light"
                    className={`${BADGE_BASE} ${publishBadge.className}`}
                  >
                    {publishBadge.label}
                  </Badge>
                </div>
                <button
                  className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isOpen ? null : mod.id);
                  }}
                >
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                  {hasIncluded(mod) && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 mb-2">
                        What's Included
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                        {mod.included.recordings > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Video size={14} className="text-neutral-500" />{" "}
                            {plural(mod.included.recordings, "Live class recording")}
                          </span>
                        )}
                        {mod.included.lessons > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Book size={14} className="text-neutral-500" />{" "}
                            {plural(mod.included.lessons, "lesson")}
                          </span>
                        )}
                        {mod.included.assignments > 0 && (
                          <span className="flex items-center gap-1.5">
                            <FileText size={14} className="text-neutral-500" />{" "}
                            {plural(mod.included.assignments, "assignment")}
                          </span>
                        )}
                        {mod.included.resources > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Folder size={14} className="text-neutral-500" />{" "}
                            {plural(mod.included.resources, "Other supporting resource")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}