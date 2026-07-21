import type { MetadataRoute } from "next";
import { INDEXABLE_PUBLIC_ROUTES, absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date("2026-07-21T00:00:00.000Z"),
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
