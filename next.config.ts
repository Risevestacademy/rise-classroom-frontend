import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const backendApiUrl =
  process.env.BACKEND_API_URL ??
  "https://rise-classroom-backend-0r0f.onrender.com/api/v1";

const nextConfig: NextConfig = {
  /**
   * Proxy the API under our own origin.
   *
   * The backend issues its session cookie as `HttpOnly; SameSite=Lax`, which
   * browsers refuse to send on cross-site requests — so calling the API
   * directly from the browser is always unauthenticated. Routing through here
   * makes those requests first-party, so the cookie is stored for this origin
   * and sent back automatically.
   */
  allowedDevOrigins: ['192.168.1.114'],
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },

  // The per-role sign-in pages were merged into a single /sign-in.
  async redirects() {
    return [
      {
        source: "/student/sign-in",
        destination: "/sign-in",
        permanent: true,
      },
      {
        source: "/instructor/sign-in",
        destination: "/sign-in",
        permanent: true,
      },
      // The per-role onboarding pages were merged into /onboarding, which is
      // where the invite email links. Query strings (the token) carry over.
      {
        source: "/:role(student|instructor)/:step(invite|create-account|complete-profile)/:rest*",
        destination: "/onboarding",
        permanent: true,
      },
      // Forgot and reset password live on one route. The backend's reset email
      // links to /reset-password?token=…, so that keeps working (the token
      // carries over). Temporary, so browsers don't cache it if the email's
      // link ever changes.
      {
        source: "/reset-password",
        destination: "/forgot-password",
        permanent: false,
      },
      {
        source: "/:role(student|instructor)/forgot-password",
        destination: "/forgot-password",
        permanent: true,
      },
    ];
  },
};

export default isDev 
? nextConfig 
: withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "risevest-academy",

  project: "rise-classroom",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
