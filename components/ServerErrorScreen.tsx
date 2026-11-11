"use client";

import { Button } from "@/components/ui/button";

/** The "Something went wrong" screen shown when a page fails to render. */
export function ServerErrorScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-background px-4">
      <div className="flex w-full max-w-[350px] flex-col items-center gap-6 text-center">
        <h1 className="text-[32px] leading-10 font-semibold text-black">
          Something went wrong...
        </h1>
        <p className="max-w-[317px] text-base text-black">
          We ran into an unexpected error on our end. Reload the page to try
          again.
        </p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    </main>
  );
}
