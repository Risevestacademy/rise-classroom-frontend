// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Local `next dev` errors are tagged "development" so they don't mix with
  // the deployed environment's (e.g. "staging") events.
  environment:
    process.env.NODE_ENV === "development"
      ? "development"
      : process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

  // Trace every request locally, but sample 10% in production to save quota.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
