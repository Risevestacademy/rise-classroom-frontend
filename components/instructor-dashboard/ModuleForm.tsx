"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Error } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { Field } from "@base-ui/react/field";

import {
  emptyModuleValues,
  moduleFormSchema,
  type ModuleFormValues,
} from "../../lib/instructor-schema";
import { useSaveModule } from "../../lib/use-instructor-forms";

type ModuleFormProps = {
  mode: "create" | "edit";
  curriculumId: string;
  moduleId?: string;
  initialValues?: ModuleFormValues;
};

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Error match={true} className="text-sm text-error-text">
      {message}
    </Error>
  );
}

function LessonCard({
  index,
  onRemove,
}: {
  index: number;
  onRemove: () => void;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ModuleFormValues>();

  const resources = useFieldArray({
    control,
    name: `lessons.${index}.resources`,
  });
  const lessonErrors = errors.lessons?.[index];

  return (
    <div className="rounded-xl border border-neutral-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-neutral-800">
            Lesson {index + 1}
          </h4>
          <p className="text-[11px] text-neutral-500">
            {resources.fields.length} supporting{" "}
            {resources.fields.length === 1 ? "resource" : "resources"}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Remove lesson ${index + 1}`}
          onClick={onRemove}
          className="h-7 w-7 rounded-lg bg-surface-error-badge text-icon-error flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <Field.Root
        className="flex flex-col space-y-1.5"
        invalid={Boolean(lessonErrors?.title)}
      >
        <Field.Label className="text-sm font-medium text-neutral-700">
          Lesson title <span className="text-text-error">*</span>
        </Field.Label>
        <Input
          {...register(`lessons.${index}.title`)}
          placeholder="Enter lesson title..."
          leadingIcon={null}
          className="text-sm h-9"
        />
        <FieldError message={lessonErrors?.title?.message} />
      </Field.Root>

      <Field.Root className="flex flex-col space-y-1.5">
        <Field.Label className="text-sm font-medium text-neutral-700">
          Description
        </Field.Label>
        <textarea
          {...register(`lessons.${index}.description`)}
          placeholder="Enter lesson description..."
          className={`${textareaClass} min-h-[70px]`}
        />
      </Field.Root>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">
            Supporting resources{" "}
            <span className="text-neutral-400 font-normal">(Optional)</span>
          </span>
          <Button
            type="button"
            variant="secondary"
            className="h-7 px-2.5 py-4 text-sm text-neutral-500 hover:bg-neutral-300 hover:text-neutral-700 font-medium rounded-lg border-neutral-300"
            onClick={() => resources.append({ title: "", url: "" })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add link
          </Button>
        </div>

        {resources.fields.map((field, resourceIndex) => {
          const resourceErrors = lessonErrors?.resources?.[resourceIndex];
          return (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  {...register(
                    `lessons.${index}.resources.${resourceIndex}.title`
                  )}
                  placeholder="Resource name"
                  leadingIcon={null}
                  className="text-sm h-9"
                />
                <FieldError message={resourceErrors?.title?.message} />
              </div>
              <div className="flex-[2] space-y-1">
                <Input
                  {...register(
                    `lessons.${index}.resources.${resourceIndex}.url`
                  )}
                  placeholder="https://..."
                  leadingIcon={null}
                  className="text-sm h-9"
                />
                <FieldError message={resourceErrors?.url?.message} />
              </div>
              <button
                type="button"
                aria-label="Remove resource"
                className="border border-neutral-300 rounded-lg p-2.5 cursor-pointer hover:bg-neutral-50"
                onClick={() => resources.remove(resourceIndex)}
              >
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ModuleForm({
  mode,
  curriculumId,
  moduleId,
  initialValues,
}: ModuleFormProps) {
  const router = useRouter();
  const isEditing = mode === "edit";

  const methods = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: initialValues ?? emptyModuleValues(),
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = methods;

  const objectives = useFieldArray({ control, name: "objectives" });
  const lessons = useFieldArray({ control, name: "lessons" });
  const assignments = useFieldArray({ control, name: "assignments" });
  const publishStatus = useWatch({ control, name: "publishStatus" });

  const watchedLessons = useWatch({ control, name: "lessons" });
  const watchedAssignments = useWatch({ control, name: "assignments" });

  const save = useSaveModule({
    mode,
    curriculumId,
    moduleId,
    baseline: initialValues,
  });

  const removeLesson = (index: number) => {
    const key = getValues(`lessons.${index}.key`);

    assignments.fields.forEach((_, i) => {
      if (
        getValues(`assignments.${i}.lessonKey`) === key &&
        !getValues(`assignments.${i}.serverId`)
      ) {
        setValue(`assignments.${i}.lessonKey`, "");
      }
    });

    lessons.remove(index);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const topicId = await save.mutateAsync(values);
      router.push(`/instructor/curriculum/${curriculumId}/modules/${topicId}`);
    } catch (error) {
      setError("root", {
        message:
          error instanceof ApiError
            ? error.message
            : "Something went wrong while saving the module.",
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="w-full flex flex-col p-6 space-y-6 tracking-wide">
        <div className="mb-2">
          <p
            onClick={() => router.back()}
            className="cursor-pointer text-sm mb-2"
          >
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
          <form
            onSubmit={onSubmit}
            noValidate
            className="w-full md:w-[70%] space-y-4"
          >
            <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-[18px] font-semibold">
                  Module details
                </CardTitle>
                <CardDescription className="text-[14px] font-regular text-neutral-500">
                  Give this module a clear title and a short introduction.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <Field.Root
                  className="flex flex-col space-y-1.5"
                  invalid={Boolean(errors.title)}
                >
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Module title <span className="text-text-error">*</span>
                  </Field.Label>
                  <Input
                    {...register("title")}
                    placeholder="Type module title..."
                    leadingIcon={null}
                  />
                  <FieldError message={errors.title?.message} />
                </Field.Root>

                <Field.Root
                  className="flex flex-col space-y-1.5"
                  invalid={Boolean(errors.description)}
                >
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Description <span className="text-text-error">*</span>
                  </Field.Label>
                  <textarea
                    {...register("description")}
                    className={`${textareaClass} min-h-[200px]`}
                  />
                  <FieldError message={errors.description?.message} />
                </Field.Root>

                <p className="text-[14px] font-regular text-neutral-500">
                  This introduction will appear on the module page.
                </p>
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
                <div className="space-y-3">
                  {objectives.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3 w-full">
                      <span className="text-sm font-semibold text-neutral-600 w-4 text-center">
                        0{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Input
                          {...register(`objectives.${index}.value`)}
                          placeholder="List objectives..."
                          leadingIcon={null}
                          className="text-sm w-full"
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove outcome ${index + 1}`}
                        className="border border-neutral-300 rounded-lg p-3 cursor-pointer hover:bg-neutral-50"
                        onClick={() =>
                          objectives.fields.length > 1 && objectives.remove(index)
                        }
                      >
                        <X className="h-4 w-4 text-neutral-500" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    className="bg-brand-on-primary text-brand-primary border border-neutral-300 rounded-lg px-4 py-5 text-sm font-medium cursor-pointer"
                    onClick={() => objectives.append({ value: "" })}
                  >
                    <Plus className="h-3.5 w-3.5 text-brand-primary mr-1" /> Add
                    outcome
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-[18px] font-semibold">
                  Module content
                </CardTitle>
                <CardDescription className="text-[14px] font-regular text-neutral-500">
                  Add a class recording. Supporting links are added under each
                  lesson.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Field.Root
                  className="flex flex-col space-y-1.5"
                  invalid={Boolean(errors.recordingUrl)}
                >
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Class recording link{" "}
                    <span className="text-neutral-400 font-normal">
                      (Optional)
                    </span>
                  </Field.Label>
                  <Input
                    {...register("recordingUrl")}
                    placeholder="https://..."
                    leadingIcon={null}
                  />
                  <FieldError message={errors.recordingUrl?.message} />
                </Field.Root>
              </CardContent>
            </Card>

            <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-[18px] font-semibold">
                  Lessons
                </CardTitle>
                <CardDescription className="text-[14px] font-regular text-neutral-500">
                  Add lessons to keep this module focused and easy to complete.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {lessons.fields.map((field, index) => (
                  <LessonCard
                    key={field.id}
                    index={index}
                    onRemove={() => removeLesson(index)}
                  />
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-9 border-neutral-300 text-sm font-medium rounded-xl cursor-pointer"
                  onClick={() =>
                    lessons.append({
                      key: crypto.randomUUID(),
                      title: "",
                      description: "",
                      resources: [],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add lesson
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-[18px] font-semibold">
                  Assignments
                </CardTitle>
                <CardDescription className="text-[14px] font-regular text-neutral-500">
                  Add practical exercises that help students apply what
                  they&apos;ve learned.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {assignments.fields.map((field, index) => {
                  const assignmentErrors = errors.assignments?.[index];
                  const current = watchedAssignments?.[index];
                  const isExisting = Boolean(current?.serverId);
                  const lessonIndex = (watchedLessons ?? []).findIndex(
                    (lesson) => lesson.key === current?.lessonKey
                  );

                  return (
                    <div
                      key={field.id}
                      className="rounded-xl border border-neutral-200 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-neutral-800">
                          Assignment {index + 1}
                        </h4>
                        <button
                          type="button"
                          aria-label={`Remove assignment ${index + 1}`}
                          onClick={() => assignments.remove(index)}
                          className="h-7 w-7 rounded-lg bg-surface-error-badge text-icon-error flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Field.Root
                        className="flex flex-col space-y-1.5"
                        invalid={Boolean(assignmentErrors?.title)}
                      >
                        <Field.Label className="text-sm font-medium text-neutral-700">
                          Assignment title{" "}
                          <span className="text-text-error">*</span>
                        </Field.Label>
                        <Input
                          {...register(`assignments.${index}.title`)}
                          placeholder="Enter assignment title..."
                          leadingIcon={null}
                          className="text-sm h-9"
                        />
                        <FieldError message={assignmentErrors?.title?.message} />
                      </Field.Root>

                      <Field.Root className="flex flex-col space-y-1.5">
                        <Field.Label className="text-sm font-medium text-neutral-700">
                          Description
                        </Field.Label>
                        <textarea
                          {...register(`assignments.${index}.description`)}
                          placeholder="Enter assignment instructions..."
                          className={`${textareaClass} min-h-[70px]`}
                        />
                      </Field.Root>

                      {isExisting ? (
  <p className="text-xs text-neutral-500">
    Attached to{" "}
    {lessonIndex >= 0
      ? `Lesson ${lessonIndex + 1}`
      : current?.lessonKey
        ? "a removed lesson"
        : "the whole module"}
  </p>
) : (
                        <Field.Root
                          className="flex flex-col space-y-1.5"
                          invalid={Boolean(assignmentErrors?.lessonKey)}
                        >
                          <Field.Label className="text-sm font-medium text-neutral-700">
  Attach to lesson{" "}
  <span className="text-neutral-400 font-normal">(Optional)</span>
</Field.Label>
<select
  {...register(`assignments.${index}.lessonKey`)}
  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-ring"
>
  <option value="">Whole module (no lesson)</option>
  {(watchedLessons ?? []).map((lesson, i) => (
    <option key={lesson.key} value={lesson.key}>
      Lesson {i + 1}
      {lesson.title ? ` · ${lesson.title}` : ""}
    </option>
  ))}
</select>
                          <FieldError message={assignmentErrors?.lessonKey?.message} />
                        </Field.Root>
                      )}
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-9 border-neutral-300 text-sm font-medium rounded-xl cursor-pointer"
                  onClick={() =>
                    assignments.append({
                      title: "",
                      description: "",
                      lessonKey: "",
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add assignment
                </Button>
              </CardContent>
            </Card>

            {errors.root?.message && (
              <FieldError message={errors.root.message} />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
  type="checkbox"
  checked={publishStatus === "DRAFT"}
  onChange={(e) =>
    setValue("publishStatus", e.target.checked ? "DRAFT" : "PUBLISHED", {
      shouldDirty: true,
    })
  }
  className="rounded border-neutral-300 text-brand-primary focus:ring-0 h-4 w-4"
/>
                <span>Keep as draft until the module is ready for students</span>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => router.back()}
                  className="flex-1 sm:flex-none border-neutral-300 rounded-xl px-5 py-2.5 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-brand-primary text-white rounded-xl px-6 py-2.5 text-sm font-medium"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Save Changes"
                      : "Create Module"}
                </Button>
              </div>
            </div>
          </form>

          <div className="w-[30%] hidden md:block space-y-4">
            <div className="rounded-2xl bg-surface-info-badge border border-border-info p-4 flex gap-3 text-neutral-700">
              <Info className="h-4 w-4 text-icon-info shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-neutral-800">
                  {isEditing
                    ? "Keep your module up to date"
                    : "Create now, build next"}
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
    </FormProvider>
  );
}