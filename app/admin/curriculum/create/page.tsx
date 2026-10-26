"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Pencil } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { CurriculumStats } from "@/components/curriculum/CurriculumStats";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminQueries } from "@/lib/admin";
import { useSelectedCohort } from "@/lib/selected-cohort";
import { createCurriculum, curriculumKeys } from "@/lib/curriculum";

const placeholderTitle = "Design Track Curriculum";
const placeholderDescription =
  "This curriculum is designed to help students build a strong foundation in product and ux design. It covers the full design process from research and ideation to prototyping and design systems.";

export default function CreateCurriculumPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [trackId, setTrackId] = React.useState("");
  const [cohortId, setCohortId] = React.useState("");
  const tracks = useQuery(adminQueries.tracks()).data ?? [];
  const cohorts = useQuery(adminQueries.cohorts()).data ?? [];
  const track = tracks.find((t) => t.id === trackId) ?? tracks[0];
  const { cohort: topNavCohort } = useSelectedCohort();
  // Defaults to the cohort picked in the top nav.
  const cohort =
    cohorts.find((c) => c.id === cohortId) ?? topNavCohort ?? cohorts[0];

  const createMutation = useMutation({
    mutationFn: () =>
      createCurriculum({
        title: title.trim(),
        description: description.trim(),
        trackId: track.id,
        cohortId: cohort?.id ?? "",
      }),
    onSuccess: (curriculum) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.list() });
      router.push(
        `/admin/curriculum?created=${encodeURIComponent(curriculum.title)}`,
      );
    },
  });

  const canSubmit =
    title.trim().length > 0 && track !== undefined && !createMutation.isPending;

  return (
    <>
      <AdminTopNav breadcrumb={[
          "Academy",
          { label: "Curriculum", href: "/admin/curriculum" },
          { label: "Add Curriculum", href: "/admin/curriculum/create" },
        ]} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Link
          href="/admin/curriculum"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Curriculum
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-neutral-800">
          Add Curriculum
        </h1>
        <p className="mt-1 max-w-xl text-sm text-neutral-500">
          Set up the curriculum structure. You can add modules, lessons,
          assignments and resources after creating it.
        </p>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]">
          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="font-bold text-neutral-800">General</h2>
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
                    placeholder: placeholderTitle,
                    leadingIcon: null,
                  }}
                />

                <Field.Root className="flex flex-col">
                  <Label icon={<></>}>Description</Label>
                  <div className="mt-1.5">
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder={placeholderDescription}
                      className="min-h-28"
                    />
                  </div>
                </Field.Root>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="font-bold text-neutral-800">Curriculum setup</h2>
              <p className="text-sm text-neutral-500">
                Assign this curriculum to a track and cohort
              </p>

              <div className="mt-5 flex flex-col gap-4">
                <Select
                  size="large"
                  label="Track"
                  value={track?.id ?? ""}
                  onChange={setTrackId}
                  options={tracks.map((t) => ({ value: t.id, label: t.name }))}
                />
                <Select
                  size="large"
                  label="Cohort"
                  value={cohort?.id ?? ""}
                  onChange={setCohortId}
                  options={cohorts.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
            </section>

            {createMutation.isError && (
              <p className="text-sm text-text-error">
                {createMutation.error.message}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="lg"
                nativeButton={false}
                render={<Link href="/admin/curriculum" />}
                className="border-neutral-200 text-neutral-800"
              >
                Cancel
              </Button>
              <Button
                size="lg"
                disabled={!canSubmit}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Creating…" : "Create Curriculum"}
              </Button>
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="p-5 pb-8">
              <h2 className="text-lg font-bold text-neutral-800">
                Curriculum overview
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                This is how the curriculum will appear
              </p>
            </div>

            <div className="relative h-28 w-full">
              <Image
                src="/curriculum-art.png"
                alt=""
                fill
                className="object-cover object-center"
              />
              <span className="absolute top-3 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-800">
                <Pencil className="h-4 w-4" />
              </span>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xl font-bold text-neutral-800">
                  {title.trim() || placeholderTitle}
                </p>
                <Badge variant="light" status="success">
                  Active
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                {track?.name ?? "Track"} · {cohort?.name ?? "Cohort"}
              </p>

              <CurriculumStats
                className="mt-4"
                totalModules={0}
                totalLessons={0}
                totalAssignments={0}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
