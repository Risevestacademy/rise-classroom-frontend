"use client";

import type { NoteItem } from "@/components/instructor-dashboard/data";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Info
} from "lucide-react";

interface NotesListProps {
  notes: NoteItem[];
}

export function NotesList({
  notes
}: NotesListProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="space-y-6 w-[70%]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Notes
          </h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Internal notes about this curriculum.
          </p>
        </div>

        {notes.map((note) => (
          <Card key={note.id} className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-[18px] font-semibold">
                {note.title}
              </CardTitle>
              <CardDescription className="text-[14px] font-regular tracking-wide text-neutral-500">
                {note.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-neutral-700">
                {note.owner} . {note.moduleNumber} . {note.date}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="w-[30%] hidden md:block">
        <Card className="max-w-[270px] bg-[#F5F6FF] border-none ring-0 shadow-none rounded-2xl p-4">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
              <Info size={16} className="text-neutral-700" />
              <span>Visibility</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <p className="text-xs text-neutral-500 leading-snug">
              All notes are only visible only to admins and assigned instructors.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
