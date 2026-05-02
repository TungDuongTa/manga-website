import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/bookmarks",
          "/profile",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: [toAbsoluteUrl("/sitemap.xml")],
  };
}
