"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { UploadedFileRow, acceptFiles } from "@/components/ui/file-upload";
import { resourceFromUpload } from "@/features/curriculum/mappers";
import type { ResourceFile } from "@/features/curriculum/types";

const acceptedExtensions = [".pdf", ".pptx", ".docx"];
const maxFileBytes = 20e6;

/**
 * Supporting resources with an "Upload file" button. PENDING-BACKEND: the API
 * has no file uploads, so picked files stay in the session; saved links still
 * show here and keep saving.
 */
export function FileUploadField({
  files,
  onChange,
}: {
  files: ResourceFile[];
  onChange: (files: ResourceFile[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState("");

  function handleFiles(fileList: FileList | null) {
    const { accepted, rejected } = acceptFiles(fileList, {
      extensions: acceptedExtensions,
      maxBytes: maxFileBytes,
    });
    setError(
      rejected.length
        ? `${rejected.join(", ")} couldn't be added. Use PDF, PPTX or DOCX files up to 20 MB.`
        : "",
    );
    onChange([...files, ...accepted.map(resourceFromUpload)]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-sm font-medium text-neutral-700">
          Supporting resources
          <span className="text-xs text-neutral-300">(Optional)</span>
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="border-neutral-200 text-neutral-800"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload file
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedExtensions.join(",")}
          aria-label="Upload supporting resources"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.map((file) => (
        <UploadedFileRow
          key={file.id}
          file={file}
          onRemove={() => onChange(files.filter((f) => f.id !== file.id))}
        />
      ))}

      <p
        className={cn(
          "text-xs",
          error ? "text-text-error" : "text-neutral-400",
        )}
      >
        {error || "PDF, PPTX or DOCX · Up to 20 MB per file"}
      </p>
    </div>
  );
}
