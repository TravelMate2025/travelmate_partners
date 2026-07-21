import { describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  DEFAULT_PARTNER_APP_URL,
  COMPANY_NAME,
  INDEXABLE_PUBLIC_ROUTES,
  PRIVATE_ROUTE_METADATA,
  PRIVATE_ROUTE_PREFIXES,
  PUBLIC_METADATA,
  absoluteUrl,
  buildRouteMetadata,
  getPartnerAppBaseUrl,
  getPrivateRouteMetadata,
} from "@/lib/seo";

describe("partner app SEO policy", () => {
  it("falls back to the production partner URL when env is missing or invalid", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTNER_APP_URL", "");
    expect(getPartnerAppBaseUrl()).toBe(DEFAULT_PARTNER_APP_URL);

    vi.stubEnv("NEXT_PUBLIC_PARTNER_APP_URL", "not a url");
    expect(getPartnerAppBaseUrl()).toBe(DEFAULT_PARTNER_APP_URL);

    vi.unstubAllEnvs();
  });

  it("builds canonical URLs from the configured partner app origin", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTNER_APP_URL", "https://partners.example.test/some/path");
    expect(getPartnerAppBaseUrl()).toBe("https://partners.example.test");
    expect(absoluteUrl("/auth/signup")).toBe("https://partners.example.test/auth/signup");
    vi.unstubAllEnvs();
  });

  it("marks indexable public entry routes as index/follow with share metadata", () => {
    for (const route of INDEXABLE_PUBLIC_ROUTES) {
      const metadata = buildRouteMetadata(PUBLIC_METADATA[route]);
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      expect(metadata.alternates).toMatchObject({ canonical: absoluteUrl(route) });
      expect(metadata.openGraph).toMatchObject({
        url: absoluteUrl(route),
        siteName: COMPANY_NAME,
      });
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
      expect(metadata).toMatchObject({
        applicationName: "TravelMate Partner",
        creator: COMPANY_NAME,
        publisher: COMPANY_NAME,
        category: "travel",
      });
      expect(metadata.icons).toBeTruthy();
    }
  });

  it("marks public auth utility routes as noindex without dropping metadata", () => {
    for (const route of ["/auth/forgot-password", "/auth/reset-password", "/auth/verify-email"]) {
      const metadata = buildRouteMetadata(PUBLIC_METADATA[route]);
      expect(metadata.title).toContain("TravelMate Partner");
      expect(metadata.description).toBeTruthy();
      expect(metadata.robots).toMatchObject({ index: false, follow: false });
    }
  });

  it("marks every private route metadata entry as noindex/nofollow", () => {
    for (const route of Object.keys(PRIVATE_ROUTE_METADATA) as Array<keyof typeof PRIVATE_ROUTE_METADATA>) {
      const metadata = getPrivateRouteMetadata(route);
      expect(metadata.title).toContain("TravelMate Partner");
      expect(metadata.description).toBeTruthy();
      expect(metadata.robots).toMatchObject({ index: false, follow: false });
    }
  });

  it("defines robots rules that disallow private console prefixes and point to the sitemap", () => {
    const policy = robots();
    expect(policy.sitemap).toBe(`${DEFAULT_PARTNER_APP_URL}/sitemap.xml`);
    expect(policy.rules).toMatchObject({
      userAgent: "*",
      allow: [...INDEXABLE_PUBLIC_ROUTES],
      disallow: [...PRIVATE_ROUTE_PREFIXES, "/api/"],
    });
  });

  it("builds a sitemap with only indexable public routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(INDEXABLE_PUBLIC_ROUTES.map((route) => absoluteUrl(route)));
    expect(urls.some((url) => url.includes("/dashboard"))).toBe(false);
    expect(urls.some((url) => url.includes("/stays"))).toBe(false);
  });
});
