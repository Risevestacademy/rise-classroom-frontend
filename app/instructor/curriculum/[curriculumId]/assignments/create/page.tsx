"use client";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { CalendarDays, ChevronDown, Info } from "lucide-react";
import { useParams, useRouter, usePathname } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Error } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Field } from "@base-ui/react/field";

import { ApiError } from "@/lib/api";
import { instructorQueries } from "@/lib/instructor";

import {
  assignmentPageSchema,
  type AssignmentPageValues,
} from "@/lib/instructor-schema";
import { useSaveAssignment } from "@/lib/use-instructor-forms";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Error match={true} className="text-sm text-error-text">
      {message}
    </Error>
  );
}

export default function CreateAssignmentPage({ }) {
  const router = useRouter();
  const pathname = usePathname();
  const { curriculumId } = useParams<{ curriculumId: string }>();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentPageValues>({
    resolver: zodResolver(assignmentPageSchema),
    defaultValues: {
      moduleId: "",
      lessonId: "",
      title: "",
      description: "",
      instruction: "",
      resources: "",
      type: "type-1",
      dueDate: "",
    },
  });

  const save = useSaveAssignment();

  const moduleId = useWatch({ control, name: "moduleId" });

  const topics = useQuery(instructorQueries.topics({ curriculumId }));
  const modules = [...(topics.data ?? [])].sort(
    (a, b) => a.position - b.position
  );

  const lessons = useQuery(instructorQueries.lessons({ topicId: moduleId }));
  const lessonsData = [...(lessons.data ?? [])].sort(
    (a, b) => a.position - b.position
  );

  const onSubmit = handleSubmit(async (values) => {
    const lessonId = values.lessonId || lessonsData[lessonsData.length - 1]?.id;
    if (!lessonId) {
      setError("moduleId", {
        message: "This module has no lessons yet. Add a lesson first.",
      });
      return;
    }
    try {
      await save.mutateAsync({ ...values, lessonId });
      router.push("/instructor/curriculum");
    } catch (error) {
      setError("root", {
        message:
          error instanceof ApiError
            ? error.message
            : "Could not create the assignment.",
      });
    }
  });

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Curriculum", href: "/instructor/curriculum" }, { label: "Add Assignment", href: pathname }]} />
      <main className="w-full flex flex-col p-6 space-y-6 tracking-wide">
        <div className="mb-2">
          <p onClick={() => (router.back())} className="cursor-pointer text-sm mb-2">
            &lt; Back to Module
          </p>
          <h1 className="text-[24px] font-semibold mb-[4px]">
            Add Assignment
          </h1>
          <p className="text-[14px] font-regular text-neutral-500">
            Create a new assignment for this curriculum.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-row gap-6 w-full items-start"
        >
          <div className="w-[70%]">
            <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl  p-4">
              <CardHeader className="p-0 mb-2">
                <CardTitle className="text-[18px] font-semibold">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {errors.root?.message && (
                    <Field.Root invalid className="w-fit">
                      <FieldError message={errors.root.message} />
                    </Field.Root>
                  )}
                  <Field.Root
                    className="flex flex-col space-y-1.5"
                    invalid={Boolean(errors.title)}
                  >
                    <Field.Label className="text-[14px] font-medium text-text-primary">
                      Assignment title <span className="text-red-500">*</span>
                    </Field.Label>
                    <Input
                      {...register("title")}
                      placeholder="Type assignment title..."
                      leadingIcon={null}
                    />
                    <FieldError message={errors.title?.message} />
                  </Field.Root>

                  <Field.Root
                    className="flex flex-col space-y-1.5"
                    invalid={Boolean(errors.description)}
                  >
                    <Field.Label className="text-[14px] font-medium text-text-primary">
                      Description <span className="text-red-500">*</span>
                    </Field.Label>
                    <textarea
                      {...register("description")}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800"
                    />
                    <FieldError message={errors.description?.message} />
                  </Field.Root>

                  <Field.Root className="flex flex-col space-y-1.5">
                    <Field.Label className="text-[14px] font-medium text-text-primary">
                      Instruction for students
                    </Field.Label>
                    <textarea
                      {...register("instruction")}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800"
                    />
                    <Error className="text-sm text-error-text"></Error>
                  </Field.Root>

                  <Field.Root className="flex flex-col space-y-1.5">
                    <Field.Label className="text-[14px] font-medium text-text-primary">
                      Resources <span className="text-neutral-400 font-normal">(Optional)</span>
                    </Field.Label>
                    <Input
                      {...register("resources")}
                      placeholder="Type module title..."
                      leadingIcon={null}
                    />
                    <Error className="text-sm text-error-text"></Error>
                  </Field.Root>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 w-full sm:w-auto mt-4">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => router.back()}
                className="flex-1 sm:flex-none border-neutral-300 rounded-lg px-5 py-4 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-brand-primary text-white rounded-lg px-6 py-4 text-sm font-medium"
              >
                {isSubmitting ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </div>

          <div className="w-[30%] hidden md:block space-y-4">
            <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-[18px] font-semibold">
                  Assignment Settings
                </CardTitle>
                <CardDescription className="text-[14px] font-regular text-neutral-500">
                  Design Cohort 2026
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <Field.Root
                  className="flex flex-col gap-1.5"
                  invalid={Boolean(errors.moduleId)}
                >
                  <label className="text-sm font-medium text-neutral-800">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      {...register("moduleId", {
                        onChange: () => setValue("lessonId", ""),
                      })}
                      className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    >
                      <option value="">Choose a module</option>
                      {modules.map((module, i) => (
                        <option key={module.id} value={module.id}>
                          Module {i + 1} - {module.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                  <FieldError message={errors.moduleId?.message} />
                </Field.Root>

                <Field.Root
                  className="flex flex-col gap-1.5"
                  invalid={Boolean(errors.dueDate)}
                >
                  <label className="text-sm font-medium text-neutral-800">
                    Date <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        {...register("dueDate")}
                        leadingIcon={<CalendarDays className="h-4 w-4 text-neutral-500" />}
                      />
                    </div>
                    <span className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700 whitespace-nowrap">
                      11:59 PM
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Students will see due date in their dashboard
                  </p>
                  <FieldError message={errors.dueDate?.message} />
                </Field.Root>

                <Field.Root className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-800">
                    Due relative to lesson
                  </label>
                  <div className="relative">
                    <select
                      {...register("lessonId")}
                      className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    >
                      {lessonsData.map((lesson, i) => (
                        <option key={lesson.id} value={lesson.id}>
                          After lesson {i + 1}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </Field.Root>

                <Field.Root className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-800">
                    Assignment type
                  </label>
                  <div className="relative">
                    <select
                      {...register("type")}
                      className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    >
                      <option value="type-1">File Upload</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </Field.Root>

              </CardContent>
            </Card>
            <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 flex gap-3 text-neutral-700">
              <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-neutral-900">
                  Create now, build next
                </p>
                <p className="text-neutral-500 leading-relaxed">
                  After creating your module, add lessons, quizzes and assignments from its detail page. Draft modules aren&apos;t visible to students until you publish them.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  )
}