"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ServerErrorScreen } from "@/components/ServerErrorScreen";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ServerErrorScreen />;
}
