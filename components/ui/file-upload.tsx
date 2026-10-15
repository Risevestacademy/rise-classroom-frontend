"use client";

import * as React from "react";
import { CheckCircle2, CloudUpload, File, X } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";

export type UploadedFile = { id: string; name: string; sizeBytes: number };

/** Splits picked files into ones that pass the type/size rules and the names that don't. */
export function acceptFiles(
  fileList: FileList | null,
  { extensions, maxBytes }: { extensions: readonly string[]; maxBytes: number }
) {
  const accepted: File[] = [];
  const rejected: string[] = [];

  for (const file of Array.from(fileList ?? [])) {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (extensions.includes(extension) && file.size <= maxBytes) accepted.push(file);
    else rejected.push(file.name);
  }

  return { accepted, rejected };
}

export function FileTypeIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const extension = name.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <span className={cn("relative inline-flex h-8 w-7 shrink-0", className)}>
      <File className="h-8 w-7 text-neutral-300" strokeWidth={1.25} />
      <span className="absolute bottom-1.5 -left-1 rounded-[3px] bg-text-error px-0.5 text-[8px] leading-3 font-bold text-white">
        {extension}
      </span>
    </span>
  );
}

export function FileChip({ file }: { file: UploadedFile }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-xs">
      <FileTypeIcon name={file.name} />
      <span className="text-sm text-neutral-800">{file.name}</span>
      <span className="text-xs text-neutral-400">
        {formatFileSize(file.sizeBytes)}
      </span>
    </span>
  );
}

export function UploadedFileRow({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
      <FileTypeIcon name={file.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-800">{file.name}</p>
        <p className="flex items-center gap-1 text-xs text-neutral-400">
          {formatFileSize(file.sizeBytes)} ·
          <CheckCircle2 className="h-3 w-3 text-text-success" />
          Uploaded
        </p>
      </div>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="text-neutral-800 hover:text-text-error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Drag-and-drop upload area with the list of files already added. */
export function FileDropzone<T extends UploadedFile>({
  label,
  optional = false,
  files,
  onChange,
  createFile,
  extensions,
  maxBytes,
  formatsLabel,
  multiple = true,
}: {
  label: string;
  optional?: boolean;
  files: T[];
  onChange: (files: T[]) => void;
  /** Turns a picked browser File into the caller's own file record. */
  createFile: (file: File) => T;
  extensions: readonly string[];
  maxBytes: number;
  /** e.g. "JPEG, PNG, PDF, and MP4" */
  formatsLabel: string;
  multiple?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState("");
  const maxLabel = `${Math.round(maxBytes / 1e6)} MB`;

  function handleFiles(fileList: FileList | null) {
    const { accepted, rejected } = acceptFiles(fileList, { extensions, maxBytes });
    setError(
      rejected.length
        ? `${rejected.join(", ")} couldn't be added. Use ${formatsLabel} files up to ${maxLabel}.`
        : ""
    );
    if (accepted.length === 0) return;
    const added = accepted.map(createFile);
    onChange(multiple ? [...files, ...added] : added.slice(0, 1));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1 text-sm font-medium text-neutral-700">
        {label}
        {optional && <span className="text-xs text-neutral-300">(Optional)</span>}
      </span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center transition-colors",
          isDragging && "border-brand-primary bg-surface-brand"
        )}
      >
        <CloudUpload className="h-5 w-5 text-neutral-500" />
        <p className="mt-4 text-sm font-medium text-neutral-800">
          Choose a file or drag &amp; drop it here.
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {formatsLabel} formats, up to {maxLabel}.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="mt-4 border-neutral-200 text-neutral-800"
        >
          Browse File
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={extensions.join(",")}
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-xs text-text-error">{error}</p>}

      {files.map((file) => (
        <UploadedFileRow
          key={file.id}
          file={file}
          onRemove={() => onChange(files.filter((f) => f.id !== file.id))}
        />
      ))}
    </div>
  );
}
