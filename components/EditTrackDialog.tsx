"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusSelect } from "@/components/ui/status-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ErrorNote } from "@/components/CohortFormFields";
import {
  adminKeys,
  adminQueries,
  getTrackErrorMessage,
  trackChanges,
  updateTrack,
  type Track,
  type TrackStatus,
  type UpdateTrackInput,
} from "@/lib/admin";
import { sessionQuery } from "@/lib/session-query";

const DESCRIPTION_MAX = 200;

const trackStatusLabels: Record<TrackStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

export function EditTrackDialog({
  trackId,
  trackName,
}: {
  trackId: string;
  trackName: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { data: session } = useQuery(sessionQuery());
  const canManage = session?.user.role === "SUPERADMIN";

  const trackQuery = useQuery({
    ...adminQueries.track(trackId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label={`Edit ${trackName}`}
        title={canManage ? undefined : "Only super admins can do this"}
        disabled={!canManage}
        onClick={() => setOpen(true)}
        className="text-neutral-400 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <DialogContent className="w-115">
        <DialogHeader>
          <DialogTitle>Edit track</DialogTitle>
          <DialogDescription>
            Update the track&apos;s details or change its status
          </DialogDescription>
        </DialogHeader>

        {trackQuery.isPending && <FormSkeleton />}

        {trackQuery.isError && (
          <ErrorNote>{getTrackErrorMessage(trackQuery.error)}</ErrorNote>
        )}

        {trackQuery.data && (
          <EditTrackForm
            key={trackQuery.data.updatedAt}
            track={trackQuery.data}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditTrackForm({
  track,
  onDone,
}: {
  track: Track;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState(track.name);
  const [description, setDescription] = React.useState(track.description);
  const [status, setStatus] = React.useState<TrackStatus>(track.status);

  const nameMissing = name.trim().length === 0;
  const descriptionMissing = description.trim().length === 0;

  const changes = trackChanges(track, { name, description, status });
  const hasChanges = Object.keys(changes).length > 0;
  const canSave = hasChanges && !nameMissing && !descriptionMissing;

  const save = useMutation({
    mutationFn: (input: UpdateTrackInput) => updateTrack(track.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.allTracks() });
      onDone();
    },
  });

  return (
    <>
      <div className="mt-6 flex flex-col gap-6">
        <FormField
          label="Track name"
          required
          error={nameMissing ? "Track name is required." : undefined}
          inputProps={{
            type: "basic",
            placeholder: "e.g Product Design",
            value: name,
            onChange: (event) => setName(event.target.value),
            leadingIcon: null,
          }}
        />

        <Field.Root className="flex w-full flex-col">
          <Label required>Description</Label>
          <div className="mt-1.5">
            <Textarea
              placeholder="What will learners build or learn in this track?"
              value={description}
              maxLength={DESCRIPTION_MAX}
              showCount
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {descriptionMissing && (
            <p className="mt-1.5 text-xs text-semantic-text-error">
              Description is required.
            </p>
          )}
        </Field.Root>

        <StatusSelect
          value={status}
          onChange={setStatus}
          options={trackStatusLabels}
        />
      </div>

      {save.error && <ErrorNote>{getTrackErrorMessage(save.error)}</ErrorNote>}

      <DialogFooter className="sm:justify-end">
        <Button
          variant="secondary"
          size="medium"
          disabled={save.isPending}
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button
          size="medium"
          disabled={!canSave || save.isPending}
          onClick={() => save.mutate(changes)}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}
