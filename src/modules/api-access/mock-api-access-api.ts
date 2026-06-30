import type {
  ApiAccessApi,
  PartnerApiCatalog,
  PartnerApiAccessOverview,
  PartnerApiClientApplication,
  SubmitPartnerApiApplicationInput,
} from "@/modules/api-access/contracts";

const STORAGE_KEY = "tm_partner_api_access_application_v1";

function readStorage(userId: string): PartnerApiClientApplication | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PartnerApiClientApplication;
  } catch {
    return null;
  }
}

function writeStorage(userId: string, value: PartnerApiClientApplication) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(value));
}

export const mockApiAccessApi: ApiAccessApi = {
  async getOverview(userId: string) {
    const application = readStorage(userId);
    return {
      application,
      statusOptions: ["no_application", "pending_review", "under_review", "approved", "rejected", "blocked"],
    } satisfies PartnerApiAccessOverview;
  },
  async getCatalog(userId: string) {
    const application = readStorage(userId);
    if (!application) {
      return {
        access: {
          status: "no_application",
          environment: null,
          scopes: [],
          productLanes: [],
          keyStatus: null,
        },
        endpoints: [],
        policyExplainer: {
          scopeGuide: [],
          blockedGuidance: "Submit and approve an API client application to unlock endpoint access.",
        },
      } satisfies PartnerApiCatalog;
    }
    return {
      access: {
        status: application.status,
        environment: application.partnerPolicy?.environment ?? "sandbox",
        scopes: ["inventory.read", "pricing.read", "bookings.read", "payments.read", "payments.write"],
        productLanes: ["stays", "transfers", "bookings"],
        keyStatus: application.keyStatus,
      },
      endpoints:
        application.status === "approved"
          ? [
              {
                id: "stays-search",
                productLane: "stays",
                method: "GET",
                path: "/api/v1/catalog/stays",
                requiredScope: "inventory.read",
                environments: ["sandbox", "production"],
                description: "List stays with core inventory metadata for storefront search.",
              },
              {
                id: "stays-pricing",
                productLane: "stays",
                method: "GET",
                path: "/api/v1/public/catalog/stays/{listingId}/pricing",
                requiredScope: "pricing.read",
                environments: ["sandbox", "production"],
                description: "Read stay pricing summary with explicit ratePlans and cancellation policy fields.",
                responseFields: ["currency", "baseRate", "weekdayRate", "weekendRate", "blackoutDates", "ratePlans"],
              },
              {
                id: "stays-rooms-list",
                productLane: "stays",
                method: "GET",
                path: "/api/v1/public/catalog/stays/{listingId}/rooms",
                requiredScope: "inventory.read",
                environments: ["sandbox", "production"],
                description: "List room inventory options for a stay listing.",
                responseFields: [
                  "roomId",
                  "name",
                  "occupancy",
                  "bedConfiguration",
                  "isBookable",
                  "totalInventory",
                  "remainingInventory",
                  "isExhausted",
                  "maxPerBooking",
                  "baseRate",
                  "images",
                ],
              },
              {
                id: "stays-rooms-pricing",
                productLane: "stays",
                method: "GET",
                path: "/api/v1/public/catalog/stays/{listingId}/rooms/{roomId}/pricing",
                requiredScope: "pricing.read",
                environments: ["sandbox", "production"],
                description: "Read room-level pricing and capacity metadata for a stay room option.",
                responseFields: [
                  "room.roomId",
                  "room.name",
                  "room.totalInventory",
                  "room.remainingInventory",
                  "room.isExhausted",
                  "capacity.totalInventory",
                  "capacity.remainingInventory",
                  "capacity.isExhausted",
                ],
              },
              {
                id: "transfers-search",
                productLane: "transfers",
                method: "GET",
                path: "/api/v1/catalog/transfers",
                requiredScope: "inventory.read",
                environments: ["sandbox", "production"],
                description: "List transfer products for route pickup and drop-off coverage.",
              },
              {
                id: "bookings-quote",
                productLane: "bookings",
                method: "POST",
                path: "/api/v1/public/bookings/quote",
                requiredScope: "bookings.write",
                environments: ["sandbox", "production"],
                description: "Create a quote lock. Include cancellationOptionId to lock non-refundable vs free-cancellation pricing.",
                responseFields: [
                  "lockId",
                  "expiresAt",
                  "roomSelections",
                  "ratePlanSelection",
                  "cancellationOptionSelection",
                  "availableCancellationOptions",
                  "availabilitySummary",
                  "pricing",
                ],
              },
              {
                id: "payments-intents-create",
                productLane: "bookings",
                method: "POST",
                path: "/api/v1/public/payments/intents",
                requiredScope: "payments.write",
                environments: ["sandbox", "production"],
                description:
                  "Create a payment intent for booking checkout. Returns a Flutterwave-hosted paymentLink and nextAction.redirect so the payer can complete payment asynchronously. State updates arrive via webhook (charge.completed / charge.failed).",
                responseFields: ["paymentIntentId", "paymentLink", "flutterwaveRef", "nextAction", "status", "paymentState", "expiresAt"],
              },
              {
                id: "payments-intents-confirm",
                productLane: "bookings",
                method: "POST",
                path: "/api/v1/public/payments/intents/{id}/confirm",
                requiredScope: "payments.write",
                environments: ["sandbox", "production"],
                description:
                  "Poll current Flutterwave charge state for an existing payment intent. Maps successful → succeeded/captured, failed → failed. Safe to call repeatedly; returns the current state without double-charging.",
                responseFields: ["status", "paymentState", "paymentIntentId", "flutterwaveRef"],
              },
              {
                id: "payments-intents-read",
                productLane: "bookings",
                method: "GET",
                path: "/api/v1/public/payments/intents/{id}",
                requiredScope: "payments.read",
                environments: ["sandbox", "production"],
                description:
                  "Read the current status of a payment intent including Flutterwave charge state, paymentLink, and linked booking reference.",
                responseFields: ["paymentIntentId", "status", "paymentState", "flutterwaveRef", "paymentLink", "bookingReference"],
              },
            ]
          : [],
      policyExplainer: {
        scopeGuide: [
          {
            scope: "inventory.read",
            description: "Read stays and transfers inventory metadata.",
            endpointCount: 2,
            endpoints: ["/api/v1/catalog/stays", "/api/v1/catalog/transfers"],
          },
          {
            scope: "payments.read",
            description: "Read payment intent status, Flutterwave charge state, and payment lifecycle metadata.",
            endpointCount: 1,
            endpoints: ["/api/v1/public/payments/intents/{id}"],
          },
          {
            scope: "pricing.read",
            description: "Read stay/transfer pricing contracts, including stay ratePlans and policy metadata.",
            endpointCount: 1,
            endpoints: ["/api/v1/public/catalog/stays/{listingId}/pricing"],
          },
          {
            scope: "payments.write",
            description: "Create payment intents that return a Flutterwave-hosted payment link; poll charge state via confirm.",
            endpointCount: 2,
            endpoints: ["/api/v1/public/payments/intents", "/api/v1/public/payments/intents/{id}/confirm"],
          },
        ],
        blockedGuidance: "All configured product lanes currently have matching scope coverage.",
      },
    } satisfies PartnerApiCatalog;
  },

  async submitApplication(userId: string, input: SubmitPartnerApiApplicationInput) {
    const existing = readStorage(userId);
    if (existing && (existing.status === "pending_review" || existing.status === "approved")) {
      throw new Error("An active API client application already exists for this partner.");
    }

    const next: PartnerApiClientApplication = {
      id: `api-client-${Date.now()}`,
      companyName: input.companyName,
      applicantName: input.applicantName,
      email: input.email,
      useCase: input.useCase,
      region: input.region || "Global",
      status: "pending_review",
      plan: "starter",
      keyStatus: "not_issued",
      riskLevel: "medium",
      submittedAt: new Date().toISOString(),
      approvedAt: null,
      usage: {
        monthlyRequests: 0,
        rateLimitPerMinute: input.requestedRateLimitPerMinute,
        errorRatePercent: 0,
        lastActiveAt: "Not active yet",
      },
      requestedRateLimitPerMinute: input.requestedRateLimitPerMinute,
      note: "",
    };
    writeStorage(userId, next);
    return next;
  },
  async revealSecret(_userId: string) {
    throw new Error("One-time credential reveal is only available in real API mode.");
  },
};
