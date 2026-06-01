import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/api/",
          "/bookmarks",
          "/profile",
          "/sign-in",
          "/sign-up",
          "/browse",
          "/latest",
          "/ranking",
          "/18+",
        ],
      },
    ],
    sitemap: [toAbsoluteUrl("/sitemap.xml")],
  };
}
