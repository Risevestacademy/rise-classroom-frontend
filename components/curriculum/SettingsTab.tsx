"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { InfoNote } from "@/components/ui/info-note";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { curriculumKeys, updateCurriculum } from "@/lib/curriculum.api";
import { formatDate } from "@/lib/curriculum.mappers";
import type {
  Curriculum,
  ModuleStatus,
  ProgressMode,
  UpdateCurriculumInput,
} from "@/lib/curriculum.types";

const statusOptions: RadioOption<ModuleStatus>[] = [
  {
    value: "PUBLISHED",
    label: "Published",
    description: "Student can access this Curriculum",
  },
  {
    value: "DRAFT",
    label: "Draft",
    description: "Only admin and instructors can view this curriculum",
  },
];

const progressOptions: RadioOption<ProgressMode>[] = [
  {
    value: "SEQUENTIAL",
    label: "Sequential",
    description: "Student complete modules in order",
  },
  {
    value: "FLEXIBLE",
    label: "Flexible",
    description: "Students can access available modules freely",
  },
];

type RadioOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export function SettingsTab({ curriculum }: { curriculum: Curriculum }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState(curriculum.title);
  const [description, setDescription] = React.useState(curriculum.description);

  const updateMutation = useMutation({
    mutationFn: (input: UpdateCurriculumInput) =>
      updateCurriculum(curriculum.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: curriculumKeys.detail(curriculum.id),
      });
      queryClient.invalidateQueries({ queryKey: curriculumKeys.list() });
    },
  });

  // Radio changes show straight away and roll back if the save fails.
  const deliveryMutation = useMutation({
    mutationFn: (input: UpdateCurriculumInput) =>
      updateCurriculum(curriculum.id, input),
    onMutate: async (input) => {
      const queryKey = curriculumKeys.detail(curriculum.id);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Curriculum>(queryKey);
      queryClient.setQueryData<Curriculum>(queryKey, (current) =>
        current ? { ...current, ...input } : current,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          curriculumKeys.detail(curriculum.id),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: curriculumKeys.detail(curriculum.id),
      });
      queryClient.invalidateQueries({ queryKey: curriculumKeys.list() });
    },
  });

  const isDirty =
    title.trim() !== curriculum.title ||
    description.trim() !== curriculum.description;
  const canSave =
    isDirty && title.trim().length > 0 && !updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-800">Settings</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Manage how this curriculum is configured and delivered
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="font-bold text-neutral-800">General</h3>
            <p className="text-sm text-neutral-500">
              Basic information about this curriculum
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <FormField
                label="Curriculum name"
                required
                inputProps={{
                  type: "basic",
                  size: "medium",
                  value: title,
                  onChange: (event) => setTitle(event.target.value),
                  leadingIcon: null,
                }}
              />
              <Field.Root className="flex flex-col">
                <Label icon={<></>}>Description</Label>
                <div className="mt-1.5">
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="min-h-28"
                  />
                </div>
              </Field.Root>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                size="lg"
                disabled={!canSave}
                onClick={() =>
                  updateMutation.mutate({
                    title: title.trim(),
                    description: description.trim(),
                  })
                }
              >
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="font-bold text-neutral-800">Delivery settings</h3>
            <p className="text-sm text-neutral-500">
              Control how students access and progress
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <RadioCard
                title="Curriculum status"
                value={curriculum.publishStatus}
                options={statusOptions}
                onChange={(publishStatus) =>
                  deliveryMutation.mutate({ publishStatus })
                }
              />
              <RadioCard
                title="Progress mode"
                value={curriculum.progressMode}
                options={progressOptions}
                onChange={(progressMode) =>
                  deliveryMutation.mutate({ progressMode })
                }
              />
            </div>
          </section>

          {[updateMutation, deliveryMutation].map(
            (mutation, index) =>
              mutation.isError && (
                <p key={index} className="text-sm text-text-error">
                  {mutation.error.message}
                </p>
              ),
          )}
        </div>

        <aside>
          <InfoNote title="Version history">
            {curriculum.history.length === 0 ? (
              <p>No changes yet.</p>
            ) : (
              curriculum.history.slice(0, 5).map((entry) => (
                <div key={entry.id} className="mb-2 last:mb-0">
                  <p>
                    {entry.actor} {entry.action}
                  </p>
                  <p className="mt-1">{formatDate(entry.at)}</p>
                </div>
              ))
            )}
          </InfoNote>
        </aside>
      </div>
    </div>
  );
}

function RadioCard<T extends string>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: T;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
}) {
  const id = React.useId();

  return (
    <div className="rounded-xl bg-neutral-100 p-5">
      <p id={id} className="font-medium text-neutral-800">
        {title}
      </p>
      <RadioGroup
        aria-labelledby={id}
        value={value}
        onValueChange={(next) => onChange(next as T)}
        className="mt-4 flex flex-col gap-4"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3"
          >
            <Radio.Root
              value={option.value}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 data-checked:border-[5px] data-checked:border-brand-primary"
            >
              <Radio.Indicator />
            </Radio.Root>
            <span>
              <span className="block text-neutral-800">{option.label}</span>
              <span className="mt-1 block max-w-80 text-sm text-neutral-500">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
