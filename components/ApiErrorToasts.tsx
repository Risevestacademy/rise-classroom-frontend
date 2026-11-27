"use client";

import * as React from "react";
import { X } from "lucide-react";

import { AlertCircle } from "@/assets/icons";
import { ApiError } from "@/lib/api";

// The design's toasts for a request that was rate limited (429) or took too
// long (408). Raised from the query client, so every request gets them.

type ApiToast = { id: number; kind: "rate-limited" | "timed-out"; retry?: () => void };

let toasts: ApiToast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function dismiss(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

/** Shows the toast a failed request calls for, if any. One of each kind at a time. */
export function toastForApiError(error: unknown, retry?: () => void) {
  const kind =
    error instanceof ApiError && error.status === 429
      ? "rate-limited"
      : (error instanceof ApiError && error.status === 408) ||
          (error instanceof DOMException && error.name === "TimeoutError")
        ? "timed-out"
        : null;
  if (!kind) return;

  const id = Date.now() + Math.random();
  toasts = [...toasts.filter((toast) => toast.kind !== kind), { id, kind, retry }];
  emit();
  setTimeout(() => dismiss(id), 8000);
}

const copy = {
  "rate-limited": {
    title: "Too many requests",
    message: "You've made too many requests. Please wait a moment and try again.",
  },
  "timed-out": {
    title: "Request Timeout",
    message: "This is taking longer than expected. Please try again.",
  },
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => toasts;
// The same array every time, or React re-renders forever.
const noToasts: ApiToast[] = [];
const serverSnapshot = () => noToasts;

export function ApiErrorToasts() {
  const current = React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  return (
    <div className="pointer-events-none fixed top-20 right-4 z-50 flex w-[calc(100%-2rem)] max-w-[372px] flex-col gap-3 sm:right-8">
      {current.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto relative flex items-center gap-3 rounded-xl bg-white p-4 shadow-lg"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(toast.id)}
            className="absolute -top-2.5 -left-2.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
          >
            <X className="size-3.5" />
          </button>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-error-surface text-icon-error">
            <AlertCircle className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-primary">{copy[toast.kind].title}</p>
            <p className="text-[13px]/[18px] text-text-secondary">{copy[toast.kind].message}</p>
          </div>
          {toast.retry && (
            <button
              type="button"
              onClick={() => {
                dismiss(toast.id);
                toast.retry?.();
              }}
              className="shrink-0 cursor-pointer rounded-lg border border-border-default px-3 py-2 text-sm font-medium text-text-brand hover:bg-interactive-secondary-hover"
            >
              Try again
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
