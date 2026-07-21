import type { Metadata } from "next";

export type RouteIndexing = "index" | "noindex";

export type RouteMetadataConfig = {
  path: string;
  title: string;
  description: string;
  indexing: RouteIndexing;
};

export const PARTNER_APP_NAME = "TravelMate Partner";
export const DEFAULT_PARTNER_APP_URL = "https://partners.travelmateglo.com";
export const DEFAULT_SHARE_IMAGE_PATH = "/opengraph-image";

export function getPartnerAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PARTNER_APP_URL || DEFAULT_PARTNER_APP_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_PARTNER_APP_URL;
  }
}

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getPartnerAppBaseUrl()).toString();
}

export const INDEXABLE_PUBLIC_ROUTES = ["/", "/auth/signup", "/auth/login"] as const;

export const PUBLIC_METADATA: Record<string, RouteMetadataConfig> = {
  "/": {
    path: "/",
    title: "TravelMate Partner",
    description: "Grow your travel business with one console for onboarding, verified inventory, bookings, and settlements.",
    indexing: "index",
  },
  "/auth/signup": {
    path: "/auth/signup",
    title: "Create Partner Account",
    description: "Apply for TravelMate Partner access and start onboarding your stay or transfer business.",
    indexing: "index",
  },
  "/auth/login": {
    path: "/auth/login",
    title: "Sign In",
    description: "Sign in to TravelMate Partner to manage listings, bookings, API access, reports, and settlements.",
    indexing: "index",
  },
  "/auth/forgot-password": {
    path: "/auth/forgot-password",
    title: "Reset Password",
    description: "Request a secure password reset code for your TravelMate Partner account.",
    indexing: "noindex",
  },
  "/auth/reset-password": {
    path: "/auth/reset-password",
    title: "Set New Password",
    description: "Set a new password for your TravelMate Partner account using your reset code.",
    indexing: "noindex",
  },
  "/auth/verify-email": {
    path: "/auth/verify-email",
    title: "Verify Email",
    description: "Verify your TravelMate Partner account email address with a one-time code.",
    indexing: "noindex",
  },
};

export const PRIVATE_ROUTE_METADATA: Record<string, RouteMetadataConfig> = {
  "/api-access": {
    path: "/api-access",
    title: "API Access",
    description: "Manage TravelMate Partner API client applications, credentials, scopes, and integration docs.",
    indexing: "noindex",
  },
  "/bookings": {
    path: "/bookings",
    title: "Booking History",
    description: "Review partner booking history, booking status, rate plans, cancellation terms, and booking actions.",
    indexing: "noindex",
  },
  "/bookings/[bookingReference]": {
    path: "/bookings/[bookingReference]",
    title: "Booking Detail",
    description: "Review a partner booking detail, lifecycle status, rate plan, cancellation option, and available actions.",
    indexing: "noindex",
  },
  "/dashboard": {
    path: "/dashboard",
    title: "Dashboard",
    description: "Track partner listing performance, operational alerts, verification state, and quick actions.",
    indexing: "noindex",
  },
  "/notifications": {
    path: "/notifications",
    title: "Notifications",
    description: "Review partner notifications for verification, moderation, settlements, refunds, and listing reminders.",
    indexing: "noindex",
  },
  "/onboarding": {
    path: "/onboarding",
    title: "Onboarding",
    description: "Complete the partner business profile, contact details, and operating coverage required for activation.",
    indexing: "noindex",
  },
  "/pricing-availability": {
    path: "/pricing-availability",
    title: "Stay Pricing and Availability",
    description: "Configure stay rates, seasonal overrides, min/max stay rules, and blackout dates.",
    indexing: "noindex",
  },
  "/reports": {
    path: "/reports",
    title: "Reports and Insights",
    description: "View partner performance metrics, listing health, booking activity, and report exports.",
    indexing: "noindex",
  },
  "/settings": {
    path: "/settings",
    title: "Support and Settings",
    description: "Manage partner preferences, support tickets, security settings, and account actions.",
    indexing: "noindex",
  },
  "/stays": {
    path: "/stays",
    title: "Stay Listings",
    description: "Create, edit, publish, pause, and maintain partner stay inventory.",
    indexing: "noindex",
  },
  "/stays/new": {
    path: "/stays/new",
    title: "Create Stay",
    description: "Create a draft stay listing with core property details, location, amenities, and policies.",
    indexing: "noindex",
  },
  "/stays/[stayId]": {
    path: "/stays/[stayId]",
    title: "Stay Listing Detail",
    description: "Edit stay listing details, media, rooms, lifecycle state, and moderation actions.",
    indexing: "noindex",
  },
  "/transfer-pricing-scheduling": {
    path: "/transfer-pricing-scheduling",
    title: "Transfer Pricing and Scheduling",
    description: "Configure transfer fare rules, schedule windows, operating days, and blackout dates.",
    indexing: "noindex",
  },
  "/transfers": {
    path: "/transfers",
    title: "Transfer Listings",
    description: "Create, submit, publish, pause, and maintain transfer inventory.",
    indexing: "noindex",
  },
  "/transfers/new": {
    path: "/transfers/new",
    title: "Create Transfer",
    description: "Create a draft transfer listing with route, vehicle, and service coverage details.",
    indexing: "noindex",
  },
  "/transfers/[transferId]": {
    path: "/transfers/[transferId]",
    title: "Transfer Listing Detail",
    description: "Edit transfer route, vehicle, media, lifecycle state, and moderation actions.",
    indexing: "noindex",
  },
  "/verification": {
    path: "/verification",
    title: "Partner Verification",
    description: "Upload documents, submit verification, and track KYC or KYB review status.",
    indexing: "noindex",
  },
  "/wallet-payouts": {
    path: "/wallet-payouts",
    title: "Wallet and Settlements",
    description: "Track booking settlements, payout methods, deductions, refunds, and statement downloads.",
    indexing: "noindex",
  },
};

export const PRIVATE_ROUTE_PREFIXES = [
  "/api-access",
  "/bookings",
  "/dashboard",
  "/notifications",
  "/onboarding",
  "/pricing-availability",
  "/reports",
  "/settings",
  "/stays",
  "/transfer-pricing-scheduling",
  "/transfers",
  "/verification",
  "/wallet-payouts",
];

export function buildRouteMetadata(config: RouteMetadataConfig): Metadata {
  const canonical = absoluteUrl(config.path);
  const imageUrl = absoluteUrl(DEFAULT_SHARE_IMAGE_PATH);
  const title = config.title === PARTNER_APP_NAME ? config.title : `${config.title} | ${PARTNER_APP_NAME}`;
  const robots =
    config.indexing === "index"
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true };

  return {
    metadataBase: new URL(getPartnerAppBaseUrl()),
    title,
    description: config.description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      siteName: PARTNER_APP_NAME,
      title,
      description: config.description,
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "TravelMate Partner console preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: config.description,
      images: [imageUrl],
    },
    robots,
  };
}

export const defaultMetadata = buildRouteMetadata(PUBLIC_METADATA["/"]);

export function getPrivateRouteMetadata(path: keyof typeof PRIVATE_ROUTE_METADATA): Metadata {
  return buildRouteMetadata(PRIVATE_ROUTE_METADATA[path]);
}
