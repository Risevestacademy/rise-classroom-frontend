"use client";

import * as React from "react";
import {
  useForm,
  Controller,
  Control,
  UseFormRegister,
  FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronDown,
  Video,
  FileText,
  ClipboardList,
  Plus,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";

import { Field } from "@base-ui/react/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Error } from "@/components/ui/hint";
import { cn } from "@/lib/utils";

const lessonSchema = z.object({
  type: z.enum(["RECORDED", "RESOURCE", "ASSIGNMENT"]),
  title: z.string().min(1, "Lesson title is required."),
  description: z.string().min(1, "Description is required."),
  learningObjectives: z.string().optional(),
  module: z.string().min(1, "Module selection is required."),
  uploadMethod: z.enum(["file", "live_platform"]).default("file"),
  videoFile: z.any().optional(),
  videoUrl: z.string().optional(),
  resources: z
    .array(
      z.object({
        title: z.string().min(1, "Resource title is required"),
        url: z.string().url("Must be a valid URL"),
      })
    )
    .optional(),
  assignmentInstructions: z.string().optional(),
  dueDate: z.string().optional(),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

const LESSON_TYPES = [
  {
    id: "RECORDED",
    label: "Recorded Lesson",
    icon: Video,
  },
  {
    id: "RESOURCE",
    label: "Resource",
    icon: FileText,
  },
  {
    id: "ASSIGNMENT",
    label: "Assignment",
    icon: ClipboardList,
  },
] as const;

interface StepOneProps {
  register: UseFormRegister<LessonFormValues>;
  control: Control<LessonFormValues>;
  errors: FieldErrors<LessonFormValues>;
  onNext: () => void;
}

function StepOne({ register, control, errors, onNext }: StepOneProps) {
  const handleObjectiveFocus = (e: React.FocusEvent<any>) => {
    const target = e.target as HTMLTextAreaElement;
    if (!target.value) {
      target.value = "• ";
    }
  };

  const handleObjectiveKeyDown = (e: React.KeyboardEvent<any>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const { selectionStart, selectionEnd, value } = textarea;
      const newValue =
        value.substring(0, selectionStart) +
        "\n• " +
        value.substring(selectionEnd);
      textarea.value = newValue;
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 3;
      }, 0);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-800">
          Lesson Type
        </label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LESSON_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = field.value === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => field.onChange(type.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-teal-700 ring-1 ring-teal-700"
                        : "border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                        <Icon className="h-4 w-4 text-neutral-700" />
                      </div>
                      <span className="text-sm font-medium text-neutral-900">
                        {type.label}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center",
                        isSelected
                          ? "border-teal-700 bg-teal-700"
                          : "border-neutral-300"
                      )}
                    >
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.title)}>
        <label className="text-sm font-medium text-neutral-800">
          Lesson title <span className="text-red-500">*</span>
        </label>
        <Input
          {...register("title")}
          type="text"
          placeholder="e.g. User Interviews"
          leadingIcon={null}
        />
        {errors.title?.message && (
          <Error match={true}>{errors.title.message}</Error>
        )}
      </Field.Root>

      <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.description)}>
        <label className="text-sm font-medium text-neutral-800">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          {...register("description")}
          placeholder="Tell us what this lesson is about..."
          className="min-h-[120px] rounded-lg border border-neutral-300 p-3 text-sm"
        />
        {errors.description?.message && (
          <Error match={true}>{errors.description.message}</Error>
        )}
      </Field.Root>

      <Field.Root
        className="flex flex-col gap-1.5"
        invalid={Boolean(errors.learningObjectives)}
      >
        <label className="text-sm font-medium text-neutral-800">
          Learning objectives <span className="text-neutral-400 font-normal">(Optional)</span>
        </label>
        <Textarea
          {...register("learningObjectives")}
          placeholder="• Add a learning objective"
          onFocus={handleObjectiveFocus}
          onKeyDown={handleObjectiveKeyDown}
          className="min-h-[90px] rounded-md border border-neutral-300 p-2.5 text-sm leading-relaxed"
        />
        {errors.learningObjectives?.message && (
          <Error match={true}>{errors.learningObjectives.message}</Error>
        )}
      </Field.Root>

      <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.module)}>
        <label className="text-sm font-medium text-neutral-800">
          Module <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            {...register("module")}
            className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
          >
            <option value="">e.g. Module 3 - User Research</option>
            <option value="module-1">Module 1 - Introduction to Design</option>
            <option value="module-2">Module 2 - Design Thinking</option>
            <option value="module-3">Module 3 - User Research</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
        {errors.module?.message && (
          <Error match={true}>{errors.module.message}</Error>
        )}
      </Field.Root>

      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          onClick={() => router.back()}
          className="bg-white text-black p-5 border-black"
        >
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="bg-[#0D6D78] hover:bg-[#0B5B64] text-white px-6"
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}

interface StepTwoProps {
  register: UseFormRegister<LessonFormValues>;
  control: Control<LessonFormValues>;
  errors: FieldErrors<LessonFormValues>;
  selectedType: LessonFormValues["type"];
  resourcesList: { title: string; url: string }[];
  isSubmitting: boolean;
  onBack: () => void;
  addResourceField: () => void;
  removeResourceField: (index: number) => void;
}

function StepTwo({
  register,
  control,
  errors,
  selectedType,
  resourcesList,
  isSubmitting,
  onBack,
  addResourceField,
  removeResourceField,
}: StepTwoProps) {
  return (
    <>
      {selectedType === "RECORDED" && (
        <div className="flex flex-col gap-4">
          <Controller
            name="uploadMethod"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-4">
                <div
                  onClick={() => field.onChange("file")}
                  className={cn(
                    "flex items-start gap-4 p-5 rounded-xl border bg-neutral-50/50 cursor-pointer transition-all",
                    field.value === "file"
                      ? "border-neutral-300 ring-1 ring-neutral-300"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0",
                      field.value === "file"
                        ? "border-neutral-400 bg-neutral-200"
                        : "border-neutral-300 bg-white"
                    )}
                  >
                    {field.value === "file" && (
                      <div className="h-2 w-2 rounded-sm bg-neutral-600" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-neutral-900">
                      Import from live classroom platform
                    </span>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
                      Your external video stream is ready to import when the live class has been processed and the recording is available.

                    </p>
                  </div>
                </div>

                <div
                  onClick={() => field.onChange("live_platform")}
                  className={cn(
                    "flex items-start gap-4 p-5 rounded-xl border bg-neutral-50/50 cursor-pointer transition-all",
                    field.value === "live_platform"
                      ? "border-neutral-300 ring-1 ring-neutral-300"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0",
                      field.value === "live_platform"
                        ? "border-neutral-400 bg-neutral-200"
                        : "border-neutral-300 bg-white"
                    )}
                  >
                    {field.value === "live_platform" && (
                      <div className="h-2 w-2 rounded-sm bg-neutral-600" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-neutral-900">
                      Upload a video file
                    </span>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
                      Upload a recording from your device. Supported formats:
                      MP4, MOV, AVI, MKV
                    </p>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {selectedType === "RESOURCE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-800">
              Resource Links
            </label>
            <Button
              type="button"
              onClick={addResourceField}
              variant="outline"
              className="text-xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Resource</span>
            </Button>
          </div>

          {resourcesList.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-2">
              No resources added yet. Click "Add Resource" to attach link materials.
            </p>
          ) : (
            resourcesList.map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white p-3 rounded-lg border border-neutral-200"
              >
                <LinkIcon className="h-4 w-4 text-neutral-400 shrink-0" />
                <Input
                  {...register(`resources.${idx}.title` as const)}
                  placeholder="Resource Title"
                  className="text-xs"
                  leadingIcon={null}
                />
                <Input
                  {...register(`resources.${idx}.url` as const)}
                  placeholder="https://"
                  className="text-xs"
                  leadingIcon={null}
                />
                <button
                  type="button"
                  onClick={() => removeResourceField(idx)}
                  className="text-neutral-400 hover:text-red-500 shrink-0 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {selectedType === "ASSIGNMENT" && (
        <div className="space-y-5">
          <Field.Root
            className="flex flex-col gap-1.5"
            invalid={Boolean(errors.assignmentInstructions)}
          >
            <label className="text-sm font-medium text-neutral-800">
              Assignment Instructions <span className="text-red-500">*</span>
            </label>
            <Textarea
              {...register("assignmentInstructions")}
              placeholder="Provide step-by-step submission guidelines..."
              className="min-h-[120px] rounded-lg border border-neutral-300 p-3 text-sm bg-white"
            />
          </Field.Root>

          <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.dueDate)}>
            <label className="text-sm font-medium text-neutral-800">
              Due Date
            </label>
            <Input
              {...register("dueDate")}
              type="date"
              className="bg-white"
              leadingIcon={null}
            />
          </Field.Root>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-12">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 px-6"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#0D6D78] hover:bg-[#0B5B64] text-white px-6"
        >
          {isSubmitting ? "Processing..." : "Submit lesson"}
        </Button>
      </div>
    </>
  );
}

export function CreateLessonPage() {
  const [step, setStep] = React.useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      type: "RECORDED",
      title: "",
      description: "",
      learningObjectives: "",
      module: "",
      uploadMethod: "file",
      videoUrl: "",
      resources: [],
      assignmentInstructions: "",
      dueDate: "",
    },
  });

  const selectedType = watch("type");
  const resourcesList = watch("resources") || [];

  const handleNext = async () => {
    if (step === 1) {
      const isValidStep1 = await trigger([
        "type",
        "title",
        "description",
        "module",
      ]);
      if (isValidStep1) {
        setStep(2);
      }
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const addResourceField = () => {
    setValue("resources", [...resourcesList, { title: "", url: "" }]);
  };

  const removeResourceField = (index: number) => {
    setValue(
      "resources",
      resourcesList.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: LessonFormValues) => {
    console.log("Lesson Form Submitted:", data);
  };

  return (
    <div className="flex min-h-screen flex-col p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {step === 1 ? "Create new module" : "Upload recording"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        {step === 1 && (
          <StepOne
            register={register}
            control={control}
            errors={errors}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <StepTwo
            register={register}
            control={control}
            errors={errors}
            selectedType={selectedType}
            resourcesList={resourcesList}
            isSubmitting={isSubmitting}
            onBack={handleBack}
            addResourceField={addResourceField}
            removeResourceField={removeResourceField}
          />
        )}
      </form>
    </div>
  );
}