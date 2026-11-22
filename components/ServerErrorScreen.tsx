"use client";

import type * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

// The error pages from the design. The centred ones (500, 401) say what
// happened and offer one way out; the left-aligned ones (503, 504) add the
// status and where to get help.

function CentredScreen({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-background px-4">
      <div className="flex w-full max-w-[350px] flex-col items-center gap-6 text-center">
        <h1 className="text-[32px] leading-10 font-semibold text-black">{title}</h1>
        <p className="max-w-[317px] text-base text-black">{children}</p>
        {action}
      </div>
    </main>
  );
}

/** The "Something went wrong" screen shown when a page fails to render. */
export function ServerErrorScreen() {
  return (
    <CentredScreen
      title="Something went wrong..."
      action={<Button onClick={() => window.location.reload()}>Reload page</Button>}
    >
      We ran into an unexpected error on our end. Reload the page to try again.
    </CentredScreen>
  );
}

/** 401: the session ended while they were using the app. */
export function SignInRequiredScreen({ next }: { next: string }) {
  return (
    <CentredScreen
      title="You need to sign in"
      action={
        <Button nativeButton={false} render={<Link href={`/sign-in?${new URLSearchParams({ next })}`} />}>
          Sign in
        </Button>
      }
    >
      You&apos;re not signed in or your session has expired. Sign in to continue to Rise Classroom.
    </CentredScreen>
  );
}

const serviceErrors = {
  503: {
    eyebrow: "503 · Service unavailable",
    title: "The service is temporarily unavailable.",
    body: "We're currently doing some maintenance or experiencing high traffic. Please try again in a few minutes.",
  },
  504: {
    eyebrow: "504 · Gateway timeout",
    title: "The request timed out.",
    body: "We didn't get a response from the server in time. This could be a temporary issue. Please try again in a few minutes.",
  },
} as const;

/** 503 and 504: the backend is down or too slow to answer. */
export function ServiceErrorScreen({ status, onRetry }: { status: 503 | 504; onRetry: () => void }) {
  const copy = serviceErrors[status];
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-background px-4">
      <div className="flex w-full max-w-[532px] flex-col items-start gap-6">
        <div className="flex flex-col gap-4">
          <p className="text-base text-text-secondary uppercase">{copy.eyebrow}</p>
          <h1 className="text-[32px] leading-10 font-semibold text-black">{copy.title}</h1>
          <p className="max-w-[440px] text-base text-black">{copy.body}</p>
        </div>
        <Button onClick={onRetry}>Try again</Button>
        <p className="text-base text-text-secondary">
          For help visit{" "}
          <a href="https://help.riseclassroom.com" className="underline-offset-2 hover:underline">
            help.riseclassroom.com
          </a>{" "}
          or contact{" "}
          <a href="mailto:support@riseclassroom.com" className="underline-offset-2 hover:underline">
            support@riseclassroom.com
          </a>
        </p>
      </div>
    </main>
  );
}

/**
 * Which screen a failed request calls for: the backend down (503), too slow
 * (504), or broken (500). `null` for errors that aren't the backend's fault.
 */
export function serviceFailure(error: unknown): 500 | 503 | 504 | null {
  if (error instanceof ApiError) {
    if (error.status === 503 || error.status === 502) return 503;
    if (error.status === 504 || error.status === 408) return 504;
    return error.status >= 500 ? 500 : null;
  }
  if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) return 504;
  // fetch rejects with a TypeError when the server can't be reached at all.
  if (error instanceof TypeError) return 503;
  return null;
}
