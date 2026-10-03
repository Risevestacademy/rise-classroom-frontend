"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Calendar } from "lucide-react";

import { Field } from "@base-ui/react/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Error } from "@/components/ui/hint";

export const createModuleSchema = z.object({
  name: z.string().min(1, "Module Name is required."),
  description: z.string().min(1, "Module Description is required."),
  objective: z.string().optional(),
  numberOfLessons: z
    .number({ message: "Number of Lessons is required" })
    .int("Lessons must be a whole number")
    .positive("Lessons must be greater than 0")
    .min(1, "Number of Lessons is required"),
});

export type CreateModuleFormValues = z.infer<typeof createModuleSchema>;

export function CreateModulePage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateModuleFormValues>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      name: "",
      description: "",
      objective: "",
      numberOfLessons: 1,
    },
  });

  const onSubmit: SubmitHandler<CreateModuleFormValues> = async (data) => {
    console.log("Form Submitted:", data);
  };

  return (
    <>
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Create new module
          </h1>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-200"
        >
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.name)}>
          <label className="text-sm font-medium text-neutral-800">
            Module name <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("name")}
            disabled={isSubmitting}
            placeholder="User Research"
          />
          {errors.name?.message && <Error match={true}>{errors.name.message}</Error>}
        </Field.Root>

        <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.description)}>
          <label className="text-sm font-medium text-neutral-800">
            Description <span className="text-red-500">*</span>
          </label>
          <Textarea
            {...register("description")}
            disabled={isSubmitting}
            placeholder="Brief overview of what this module covers..."
            className="min-h-[100px] rounded-md border border-neutral-300 p-2.5 text-sm"
          />
          {errors.description?.message && (
            <Error match={true}>{errors.description.message}</Error>
          )}
        </Field.Root>

        <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.objective)}>
          <label className="text-sm font-medium text-neutral-800">
            Learning Objective <span className="text-neutral-400 font-normal">(Optional)</span>
          </label>
          <Input
            {...register("objective")}
            disabled={isSubmitting}
            placeholder="Learn conducting primary qualitative research"
          />
          {errors.objective?.message && (
            <Error match={true}>{errors.objective.message}</Error>
          )}
        </Field.Root>

        <Field.Root
          className="flex flex-col gap-1.5"
          invalid={Boolean(errors.numberOfLessons)}
        >
          <label className="text-sm font-medium text-neutral-800">
            Number of lessons <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("numberOfLessons", { valueAsNumber: true })}
            disabled={isSubmitting}
            placeholder="5"
          />
          {errors.numberOfLessons?.message && (
            <Error match={true}>{errors.numberOfLessons.message}</Error>
          )}
        </Field.Root>

        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="p-4">
            {isSubmitting ? "Creating..." : "Create module"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default CreateModulePage;