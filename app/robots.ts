import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated app areas and internal pages have nothing for crawlers.
      disallow: [
        "/admin/",
        "/instructor/",
        "/student/",
        "/onboarding/",
        "/api/",
        "/design-system",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
