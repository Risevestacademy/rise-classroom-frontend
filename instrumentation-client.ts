// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Session replay records every DOM change, and the landing page animates
// constantly, so it starts once the visitor moves on from the landing pages.
// Clarity already records sessions there.
const LANDING_PATHS = new Set(["/", "/privacy-policy"]);
const isLanding = (path: string) => LANDING_PATHS.has(path);

function addReplay() {
  const client = Sentry.getClient();
  if (client && !client.getIntegrationByName("Replay"))
    client.addIntegration(Sentry.replayIntegration());
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Local `next dev` errors are tagged "development" so they don't mix with
  // the deployed environment's (e.g. "staging") events.
  environment:
    process.env.NODE_ENV === "development"
      ? "development"
      : process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

  // Add optional integrations for additional features
  integrations: isLanding(window.location.pathname)
    ? []
    : [Sentry.replayIntegration()],

  // Trace every request locally, but sample 10% in production to save quota.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Clarity already records ordinary sessions, and every replay upload goes
  // through the /monitoring tunnel on our server. Replays are only sent for
  // sessions that hit an error, with the moments leading up to it.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});

export function onRouterTransitionStart(href: string, navigationType: string) {
  Sentry.captureRouterTransitionStart(href, navigationType);
  if (!isLanding(new URL(href, window.location.href).pathname)) addReplay();
}
