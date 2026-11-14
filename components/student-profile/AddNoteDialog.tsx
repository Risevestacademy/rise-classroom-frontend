"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";

import { Add01 } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** The Notes tab's Add Note button and the form it opens. */
export function AddNoteDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTitle("");
      setNote("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        size="medium"
        className="shrink-0 gap-2"
        onClick={() => setOpen(true)}
      >
        <Add01 className="size-[18px]" />
        Add Note
      </Button>

      <DialogContent className="w-[512px]">
        <div className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-text-primary">
              Add note
            </DialogTitle>
            <DialogDescription className="font-work text-sm text-text-secondary">
              Add an internal note about this student
            </DialogDescription>
          </DialogHeader>

          <FormField
            label="Title"
            required
            inputProps={{
              placeholder: "e.g Needs additional support with API concepts",
              value: title,
              onChange: (event) => setTitle(event.target.value),
              leadingIcon: null,
            }}
          />

          <Field.Root className="flex flex-col gap-1">
            <Label required>Note</Label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What should other admins and mentors know?"
              className="min-h-[120px]"
            />
          </Field.Root>

          <DialogFooter className="mt-0 gap-4 sm:justify-end">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleOpenChange(false)}
            >
              Back
            </Button>
            {/* PENDING-BACKEND: there's no endpoint to save a student note yet,
                so this only closes the form. */}
            <Button
              size="lg"
              disabled={!title.trim() || !note.trim()}
              onClick={() => handleOpenChange(false)}
            >
              Add note
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
