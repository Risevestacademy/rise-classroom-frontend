import Image from "next/image";
import { BookOpen, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TRACKS, type Curriculum } from "@/lib/curriculum";

export function CurriculumSummaryCard({
  curriculum,
  label,
  moduleTitle,
  moduleCaption,
  showEditIcon = false,
}: {
  curriculum: Curriculum;
  label: string;
  moduleTitle: string;
  moduleCaption: string;
  showEditIcon?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="relative h-24 w-full">
        <Image
          src="/curriculum-art.png"
          alt=""
          fill
          className="object-cover object-center"
        />
        {showEditIcon && (
          <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-800">
            <Pencil className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-neutral-400">{label}</p>
          <Badge variant="light" status="success">
            {curriculum.status}
          </Badge>
        </div>
        <p className="mt-1 text-lg font-bold text-neutral-800">
          {curriculum.title}
        </p>
        <p className="mt-0.5 text-sm text-neutral-500">
          {TRACKS[curriculum.track].label} · {curriculum.cohort}
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-lg bg-neutral-100 p-4">
          <BookOpen className="h-5 w-5 shrink-0 text-brand-primary" />
          <div>
            <p className="text-sm font-medium text-neutral-800">
              {moduleTitle}
            </p>
            <p className="text-xs text-neutral-500">{moduleCaption}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-neutral-200 pt-4">
          <Image
            src="/default-avatar.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">Instructor</p>
            <p className="text-sm font-medium text-neutral-800">
              {curriculum.instructor.name}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {curriculum.instructor.email}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
