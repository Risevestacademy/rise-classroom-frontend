"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { isHttpsLink, resourceFromLink } from "@/features/curriculum/mappers";
import type { ResourceFile } from "@/features/curriculum/types";

/*
 * Resources added as links. The API has no file uploads, so material is shared by
 * pasting a link to where it's hosted (Google Drive, Figma, YouTube…).
 */
export function LinkListField({
  label = "Supporting resources",
  optional = true,
  links,
  onChange,
}: {
  label?: string;
  optional?: boolean;
  links: ResourceFile[];
  onChange: (links: ResourceFile[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState("");

  function addLink() {
    const url = draft.trim();
    if (!url) return;
    if (!isHttpsLink(url)) {
      setError("Paste a full link starting with https://");
      return;
    }
    if (links.some((link) => link.url === url)) {
      setError("That link is already added.");
      return;
    }
    onChange([...links, resourceFromLink(url)]);
    setDraft("");
    setError("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <FormField
            label={
              <span className="flex items-center gap-1">
                {label}
                {optional && (
                  <span className="text-xs text-neutral-300">(Optional)</span>
                )}
              </span>
            }
            labelIcon={<></>}
            error={error || undefined}
            inputProps={{
              type: "basic",
              size: "medium",
              value: draft,
              onChange: (event) => {
                setDraft(event.target.value);
                if (error) setError("");
              },
              onKeyDown: (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLink();
                }
              },
              placeholder: "https://drive.google.com/…",
              leadingIcon: <Link2 className="text-text-info" />,
            }}
          />
        </div>
        <Button
          variant="secondary"
          size="medium"
          disabled={!draft.trim()}
          onClick={addLink}
          className={error ? "mb-6 border-neutral-200 text-neutral-800" : "border-neutral-200 text-neutral-800"}
        >
          <Plus className="h-4 w-4" />
          Add link
        </Button>
      </div>

      {links.map((link) => (
        <div
          key={link.id}
          className="flex items-center gap-3 rounded-xl border border-border-default bg-white py-3 pr-4 pl-3.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-brand text-brand-primary">
            <Link2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {link.title || link.name}
            </p>
            {link.url ? (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-xs text-brand-primary hover:underline"
              >
                {link.url}
              </a>
            ) : (
              /* Files picked before uploads were removed live only in this session. */
              <p className="text-xs text-text-warning">
                Uploaded file, not saved. Remove it and add a link instead.
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remove ${link.title || link.name}`}
            onClick={() => onChange(links.filter((l) => l.id !== link.id))}
            className="text-text-primary hover:text-text-error"
          >
            <X className="size-5" />
          </button>
        </div>
      ))}

      {links.length === 0 && (
        <p className="text-xs text-neutral-400">
          Add links to slides, documents or videos hosted on Google Drive, Figma,
          YouTube or similar. Make sure anyone with the link can view them.
        </p>
      )}
    </div>
  );
}
