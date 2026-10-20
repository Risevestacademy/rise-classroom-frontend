/** Public origin used for canonical URLs, the sitemap and absolute OG image links. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rise-classroom-frontend.netlify.app"
).replace(/\/$/, "");

export const SITE_NAME = "Rise Classroom";

export const SITE_DESCRIPTION =
  "Turn learning into real progress. Rise Classroom is a modern learning platform for cohorts, educators and organizations — run tracks, live sessions and curriculum in one place.";
