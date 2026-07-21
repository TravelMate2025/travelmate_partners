import type { MetadataRoute } from "next";
import { INDEXABLE_PUBLIC_ROUTES, PRIVATE_ROUTE_PREFIXES, getPartnerAppBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [...INDEXABLE_PUBLIC_ROUTES],
      disallow: [...PRIVATE_ROUTE_PREFIXES, "/api/"],
    },
    sitemap: `${getPartnerAppBaseUrl()}/sitemap.xml`,
  };
}
