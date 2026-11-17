"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { X } from "lucide-react";

import {
  Add01,
  ArrowDown01,
  Attachment,
  Image01,
  Rows,
  Video,
} from "@/assets/icons";
import { AudiencePicker } from "@/components/announcements/AudiencePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { SelectInput } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  announcementCategories,
  type AdminAnnouncement,
  type AnnouncementAudience,
  type AnnouncementCategory,
} from "@/lib/announcements";
import { formatFileSize } from "@/lib/utils";

const attachmentKinds = [
  { label: "Photo", accept: "image/*", icon: Image01 },
  { label: "Video", accept: "video/*", icon: Video },
  { label: "File", accept: undefined, icon: Attachment },
] as const;

// The Category and Audience fields aren't base-ui Fields, so they use a
// plain label styled like <Label>, without its "(Optional)" marker.
const labelClass = "flex items-center gap-1 py-0.5 text-sm font-medium text-text-primary";

const categoryOptions = announcementCategories.map(({ value, label }) => ({
  value,
  label,
}));

/** The New announcement button and the form it opens. */
export function CreateAnnouncementDialog({
  onPublish,
}: {
  onPublish: (announcement: AdminAnnouncement) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="medium" className="shrink-0" onClick={() => setOpen(true)}>
        <Add01 className="size-4.5" />
        New announcement
      </Button>

      <DialogContent className="w-151 p-6 sm:p-6">
        {open && (
          <AnnouncementForm
            onCancel={() => setOpen(false)}
            onPublish={(announcement) => {
              onPublish(announcement);
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementForm({
  onCancel,
  onPublish,
}: {
  onCancel: () => void;
  onPublish: (announcement: AdminAnnouncement) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState<AnnouncementCategory | "">("");
  const [audience, setAudience] = React.useState<AnnouncementAudience | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);

  const canPublish = Boolean(title.trim() && content.trim() && category);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!category) return;
        // PENDING-BACKEND: there's no endpoint to publish an announcement or
        // upload its attachments yet, so it only joins this page's list.
        onPublish({
          id: crypto.randomUUID(),
          title: title.trim(),
          content: content.trim(),
          category,
          audience: audience ?? { type: "EVERYONE" },
          publishedAt: new Date().toISOString(),
        });
      }}
    >
      <DialogHeader className="min-h-10 justify-center">
        <DialogTitle className="text-lg font-semibold text-text-primary">
          Create announcement
        </DialogTitle>
      </DialogHeader>

      <FormField
        label="Title"
        required
        inputProps={{
          placeholder: "Enter a clear and concise title",
          value: title,
          onChange: (event) => setTitle(event.target.value),
          leadingIcon: null,
        }}
      />

      <Field.Root className="flex flex-col gap-1">
        <Label required>Content</Label>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your announcement"
          className="min-h-19 text-[13px]/4.5"
        />
      </Field.Root>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="announcement-category" className={labelClass}>
            Category <span className="text-text-error">*</span>
          </label>
          <SelectInput
            id="announcement-category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            placeholder="Select a category"
            leadingIcon={<Rows />}
            className="h-9 px-2.5"
            chevron={<ArrowDown01 className="size-4" />}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="announcement-audience" className={labelClass}>
            Audience
          </label>
          <AudiencePicker
            id="announcement-audience"
            value={audience}
            onChange={setAudience}
          />
        </div>
      </div>

      <Attachments files={files} onChange={setFiles} />

      <DialogFooter className="mt-0 gap-4 sm:justify-end">
        <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={!canPublish}>
          Publish now
        </Button>
      </DialogFooter>
    </form>
  );
}

function Attachments({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputs = React.useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-primary">
        <span className="font-medium">Attachments</span> (optional)
      </p>

      <div className="flex flex-wrap gap-3">
        {attachmentKinds.map(({ label, accept, icon: Icon }) => (
          <React.Fragment key={label}>
            <button
              type="button"
              onClick={() => inputs.current[label]?.click()}
              className="flex h-9.5 items-center gap-1 rounded-lg border border-border-default bg-white px-3 text-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:border-border-focus focus-visible:outline-none"
            >
              <Icon className="size-4" />
              {label}
            </button>
            <input
              ref={(node) => {
                inputs.current[label] = node;
              }}
              type="file"
              accept={accept}
              multiple
              hidden
              aria-label={`Attach ${label.toLowerCase()}`}
              onChange={(event) => {
                onChange([...files, ...Array.from(event.target.files ?? [])]);
                event.target.value = "";
              }}
            />
          </React.Fragment>
        ))}
      </div>

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border-default bg-white py-1.5 pr-1.5 pl-2.5 text-xs"
            >
              <span className="truncate font-medium text-text-primary">
                {file.name}
              </span>
              <span className="shrink-0 text-text-muted">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="flex size-5 items-center justify-center rounded text-icon-muted hover:bg-surface-subtle"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
