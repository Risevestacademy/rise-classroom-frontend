"use client";

import * as React from "react";
import { X } from "lucide-react";

export function SuccessToast({
  title,
  message,
  onDismiss,
}: {
  title: string;
  message: React.ReactNode;
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const timeout = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="fixed top-20 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-4 shadow-lg sm:right-8"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute -top-2.5 -left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <p className="text-sm font-semibold text-neutral-800">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{message}</p>
    </div>
  );
}
