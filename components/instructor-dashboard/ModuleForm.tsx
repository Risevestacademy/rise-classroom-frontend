"use client";

import { BookOpen, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Error } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Field } from "@base-ui/react/field";

type ModuleItem = {
  id: string;
  title: string;
  description: string;
  resources: string[];
};

export type ModuleFormValues = {
  title: string;
  description: string;
  objectives: string[];
  recordingUrl: string;
  lessons: ModuleItem[];
  assignments: ModuleItem[];
  isDraft: boolean;
};

type ModuleFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<ModuleFormValues>;
};

export default function ModuleForm({
  mode,
  initialValues,
}: ModuleFormProps) {
  const router = useRouter();
  const isEditing = mode === "edit";

  const [objectives, setObjectives] = useState<string[]>(
    initialValues?.objectives?.length ? initialValues.objectives : [""],
  );

  const [lessons, setLessons] = useState<ModuleItem[]>(
    initialValues?.lessons ?? [{ id: Date.now().toString(), title: "", description: "", resources: [] }],
  );

  const [assignments, setAssignments] = useState<ModuleItem[]>(
    initialValues?.assignments ?? [{ id: Date.now().toString(), title: "", description: "", resources: [] }],
  );

  const addObjective = () => setObjectives((prev) => [...prev, ""]);
  const removeObjective = (index: number) => {
    if (objectives.length > 1) {
      setObjectives((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addLesson = () => {
    setLessons((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", description: "", resources: [] },
    ]);
  };
  const removeLesson = (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  };

  const addAssignment = () => {
    setAssignments((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", description: "", resources: [] },
    ]);
  };
  const removeAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full flex flex-col p-6 space-y-6 tracking-wide">
      <div className="mb-2">
        <p onClick={() => (router.back())} className="cursor-pointer text-sm mb-2">
          &lt; Back to Module
        </p>
        <h1 className="text-[24px] font-semibold mb-[4px]">
          {isEditing ? "Edit Module" : "Add Module"}
        </h1>
        <p className="text-[14px] font-regular text-neutral-500">
          Define what students will learn, then build out your module content.
        </p>
      </div>

      <div className="flex flex-row gap-6 w-full items-start">
        <form className="w-full md:w-[70%] space-y-4">
          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[18px] font-semibold">
                Module details
              </CardTitle>
              <CardDescription className="text-[14px] font-regular text-neutral-500">
                Give this module a clear title and a short introduction.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                <Field.Root className="flex flex-col space-y-1.5">
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Module title <span className="text-red-500">*</span>
                  </Field.Label>
                  <Input
                    name="title"
                    placeholder="Type module title..."
                    leadingIcon={null}
                    defaultValue={initialValues?.title}
                  />
                  <Error className="text-sm text-error-text"></Error>
                </Field.Root>

                <Field.Root className="flex flex-col space-y-1.5">
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Description <span className="text-red-500">*</span>
                  </Field.Label>
                  <textarea
                    name="description"
                    defaultValue={initialValues?.description}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800"
                  />
                  <Error className="text-sm text-error-text"></Error>
                </Field.Root>

                <p className="text-[14px] font-regular text-neutral-500">This introduction will appear on the module page.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[18px] font-semibold">
                What students will learn
              </CardTitle>
              <CardDescription className="text-[14px] font-regular text-neutral-500">
                By the end of this module, students will be able to:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="list space-y-3">
                {objectives.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 w-full">
                    <span className="text-sm font-semibold text-neutral-600 w-4 text-center">
                      0{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Input
                        name={`objectives[${index}]`}
                        placeholder="List objectives..."
                        leadingIcon={null}
                        className="text-sm w-full"
                        defaultValue={item}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove outcome ${index + 1}`}
                      className="border border-neutral-300 rounded-lg p-3 cursor-pointer hover:bg-neutral-50"
                      onClick={() => removeObjective(index)}
                    >
                      <X className="h-4 w-4 text-neutral-500" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Button
                  type="button"
                  className="bg-brand-on-primary hover:bg-neutral-350 text-brand-primary border border-neutral-300 rounded-lg px-4 py-5 text-sm font-medium cursor-pointer"
                  onClick={addObjective}
                >
                  <Plus className="h-3.5 w-3.5 text-brand-primary mr-1" /> Add outcome
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[18px] font-semibold">Module content</CardTitle>
              <CardDescription className="text-[14px] font-regular text-neutral-500">
                Add a class recording and supporting material. You can add more later.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-text-primary">
                  Class recording link <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <Input
                  name="recordingUrl"
                  placeholder="https://..."
                  leadingIcon={null}
                  defaultValue={initialValues?.recordingUrl}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[14px] font-medium text-text-primary">
                    Supporting resources <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <Button type="button" variant="outline" className="h-8 px-4 py-5 text-sm font-medium rounded-lg border-neutral-300">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Upload file
                  </Button>
                </div>
                <p className="text-[12px] text-neutral-400">PDF, PPTX or DOCX • Up to 20 MB per file</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[18px] font-semibold">Lessons</CardTitle>
              <CardDescription className="text-[14px] font-regular text-neutral-500">
                Add lessons to keep this module focused and easy to complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="rounded-xl border border-neutral-200 p-4 space-y-4 bg-neutral-00">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">Lesson {index + 1}</h4>
                      <p className="text-[11px] text-neutral-500">0 supporting resources</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLesson(lesson.id)}
                      className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Lesson title</label>
                    <Input
                      name={`lessons[${index}][title]`}
                      placeholder="Enter lesson title..."
                      leadingIcon={null}
                      className="text-sm h-9"
                      defaultValue={lesson.title}
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Description</label>
                    <textarea
                      name={`lessons[${index}][description]`}
                      defaultValue={lesson.description}
                      placeholder="Enter lesson description..."
                      className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-neutral-800"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-neutral-700">Supporting resources <span className="text-neutral-400 font-normal">(Optional)</span></span>
                    <Button type="button" variant="outline" className="h-7 px-2.5 py-4 text-sm text-neutral-500  hover:bg-neutral-300 hover:text-neutral-700 font-medium rounded-lg border-neutral-300">
                      <Plus className="h-3 w-3 mr-1" /> Upload file
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full h-9 border-neutral-300 text-sm font-medium rounded-xl cursor-pointer"
                onClick={addLesson}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add lesson
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[18px] font-semibold">Assignments</CardTitle>
              <CardDescription className="text-[14px] font-regular text-neutral-500">
                Add practical exercises that help students apply what they've learned.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {assignments.map((assignment, index) => (
                <div key={assignment.id} className="rounded-xl border border-neutral-200 p-4 space-y-4 bg-neutral-00">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">Assignment {index + 1}</h4>
                      <p className="text-[11px] text-neutral-500">0 supporting resources</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssignment(assignment.id)}
                      className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Assignment title</label>
                    <Input
                      name={`assignments[${index}][title]`}
                      placeholder="Enter assignment title..."
                      leadingIcon={null}
                      className="text-sm h-9"
                      defaultValue={assignment.title}
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Description</label>
                    <textarea
                      name={`assignments[${index}][description]`}
                      defaultValue={assignment.description}
                      placeholder="Enter assignment instructions..."
                      className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-neutral-800"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-neutral-700">Supporting resources <span className="text-neutral-400 font-normal">(Optional)</span></span>
                    <Button type="button" variant="outline" className="h-7 px-2.5 py-4 text-sm text-neutral-500  hover:bg-neutral-300 hover:text-neutral-700 font-medium rounded-lg border-neutral-300">
                      <Plus className="h-3 w-3 mr-1" /> Upload file
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full h-9 border-neutral-300 text-sm font-medium rounded-xl cursor-pointer"
                onClick={addAssignment}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add assignment
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
              <input
                name="isDraft"
                type="checkbox"
                defaultChecked={initialValues?.isDraft ?? true}
                className="rounded border-neutral-300 text-brand-primary focus:ring-0 h-4 w-4"
              />
              <span>Keep as draft until the module is ready for students</span>
            </label>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none border-neutral-300 rounded-xl px-5 py-2.5 text-sm font-medium">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none bg-brand-primary text-white rounded-xl px-6 py-2.5 text-sm font-medium">
                {isEditing ? "Save Changes" : "Create Module"}
              </Button>
            </div>
          </div>
        </form>

        <div className="w-[30%] hidden md:block space-y-4">
          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl overflow-hidden p-0">
            <div className="relative w-full h-36 bg-blue-100">
              <Image
                src="/curriculum-header.png"
                alt="Curriculum Header"
                fill
                className="object-cover"
                priority
              />
              <Button
                type="button"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white text-neutral-800 shadow-sm hover:bg-neutral-100 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-500">
                  {isEditing ? "Editing in" : "Adding to"}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-sm font-medium border-0"
                >
                  Active
                </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                  Design Track Curriculum
                </h1>
                <p className="text-sm text-neutral-500 font-medium">
                  Design · Cohort 2026
                </p>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="h-9 w-9 rounded-lg bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">Module 1</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {isEditing
                      ? "Module in the Design Track curriculum."
                      : "Added after the 12 existing modules."}
                  </p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                    Instructor
                  </p>
                  <h4 className="text-sm font-bold text-neutral-900">Aishat Lawal</h4>
                  <p className="text-[11px] text-neutral-500">
                    aishatalawal21@gmail.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 flex gap-3 text-neutral-700">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-neutral-900">
                {isEditing ? "Keep your module up to date" : "Create now, build next"}
              </p>
              <p className="text-neutral-500 leading-relaxed">
                {isEditing
                  ? "Update the module details, lessons and assignments as your curriculum evolves. Draft modules aren't visible to students until you publish them."
                  : "After creating your module, add lessons, quizzes and assignments from its detail page. Draft modules aren't visible to students until you publish them."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}