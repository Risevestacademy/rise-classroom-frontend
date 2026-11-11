"use client";

import "./globals.css";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ServerErrorScreen } from "@/components/ServerErrorScreen";
import { cn } from "@/lib/utils";
import { lato, workSans } from "./fonts";

/** Replaces the root layout when it fails, so it brings its own styles and fonts. */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={cn(lato.variable, workSans.variable, "font-lato")}>
      <body>
        <title>Something went wrong | Rise Classroom</title>
        <ServerErrorScreen />
      </body>
    </html>
  );
}
